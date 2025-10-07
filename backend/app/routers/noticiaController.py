from fastapi import APIRouter,Query , HTTPException, status, Depends, UploadFile, File
from core.ConnectDB import db
import os
import uuid
from typing import List
from models.noticiasModel import Noticias
from schemas.noticiasSchema import noticia_schema
from core.security import isEditorOrHigher, isPublicadorOrHigher, getTokenId
from utils.infoVerify import validImagenes, validCategoria, validUser
from utils.HttpError import errorInterno
from utils.DbHelper import paginar,totalPages

router = APIRouter(prefix="/noticia", tags=["Noticias"])

UPLOAD_DIR = "imagenesDB"

@router.get("/", status_code=status.HTTP_200_OK)
async def getNoticias(
    page: int = Query(1, ge=1,description="Número de página"),
    size: int = Query(10, ge=1, le=100),
):
    try:
        offset = paginar(page,size)
        
        query = """
            SELECT 
                n.id,
                n.titulo,
                n.contenido,
                n.activo,
                n.fecha_creacion,
                c.id AS categoria_id,
                c.nombre AS categoria_nombre,
                u.id AS usuario_id,
                u.usuario AS usuario_nombre,
                n.autor,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', i.id,
                            'imagen', i.imagen,
                            'tipo_imagen', i.tipo_imagen
                        )
                    ) FILTER (WHERE i.id IS NOT NULL), '[]'::json
                ) AS imagenes
            FROM noticias n
            JOIN categorias c ON n.categoria_id = c.id
            JOIN usuarios u ON n.usuario_id = u.id
            LEFT JOIN imagenes i ON i.noticia_id = n.id
            WHERE n.activo = TRUE  -- quitar o modificar según GET /all
            GROUP BY n.id, c.id, u.id
            ORDER BY n.fecha_creacion DESC
            LIMIT :size OFFSET :offset;
        """
        
        result = await db.fetch_all(query,{"size":size,"offset":offset})

        if not result:
            return {
            "page": page,
            "size": size,
            "total":0,
            "total_pages": 0,
            "usuarios": [noticia_schema(row) for row in result]
        }

        total = await db.fetch_val("SELECT COUNT(*) FROM noticias WHERE activo = TRUE")
        return {
            "page": page,
            "size": size,
            "total":total,
            "total_pages": totalPages(total, size),
            "noticias": [noticia_schema(row) for row in result]
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500,
                            detail=f"error: {e}")

@router.get("/all", status_code=status.HTTP_200_OK)
async def get_noticias_admin(
    page: int = Query(1, ge=1, description="Número de página"),
    size: int = Query(10, ge=1, le=100),
    _: bool = Depends(isPublicadorOrHigher)
):
    try:
        offset = paginar(page, size)

        query = """
            SELECT 
                n.id,
                n.titulo,
                n.contenido,
                n.activo,
                n.fecha_creacion,
                c.id AS categoria_id,
                c.nombre AS categoria_nombre,
                u.id AS usuario_id,
                u.usuario AS usuario_nombre,
                n.autor,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', i.id,
                            'imagen', i.imagen,
                            'tipo_imagen', i.tipo_imagen
                        )
                    ) FILTER (WHERE i.id IS NOT NULL), '[]'::json
                ) AS imagenes
            FROM noticias n
            JOIN categorias c ON n.categoria_id = c.id
            JOIN usuarios u ON n.usuario_id = u.id
            LEFT JOIN imagenes i ON i.noticia_id = n.id
            WHERE n.activo = TRUE  -- quitar o modificar según GET /all
            GROUP BY n.id, c.id, u.id
            ORDER BY n.fecha_creacion DESC
            LIMIT :size OFFSET :offset;
        """

        result = await db.fetch_all(query, {"size": size, "offset": offset})

        if not result:
            return {
                "page": page,
                "size": size,
                "total": 0,
                "total_pages": 0,
                "noticias": []
            }

        total = await db.fetch_val("SELECT COUNT(*) FROM noticias")

        return {
            "page": page,
            "size": size,
            "total": total,
            "total_pages": totalPages(total, size),
            "noticias": [noticia_schema(row) for row in result]
        }

    except HTTPException:
        raise
    except Exception as e:
        raise errorInterno(e)

@router.post("/")
async def crear_noticia(
    noticia: Noticias = Depends(Noticias.from_form),
    imagenes: List[UploadFile] = File(...),
    userId: int = Depends(getTokenId),
    _: bool = Depends(isEditorOrHigher)
):
    try:
        validImagenes(imagenes)
        validCategoria(noticia.categoria_id)
        await validUser(userId,1)
        
        async with db.transaction():
            query = """
            INSERT INTO noticias(titulo,contenido,activo,categoria_id,usuario_id,autor)
            VALUES (:titulo,:contenido,:activo,:categoria_id,:usuario_id,:autor)
            RETURNING id
            """

            values = noticia.model_dump()
            del values["id"]
            values["usuario_id"] = userId
            values["activo"] = False

            noticia_id = await db.fetch_val(query, values)
            if not noticia_id :
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Error al crear la noticia"
                )

            os.makedirs(UPLOAD_DIR, exist_ok=True)
            await insert_img(imagenes, noticia_id)

            return {
                "detail": "Noticia creada exitosamente en estado de espera a se aprobada para su publicacion"
            }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500,
                            detail=f": {e}")


@router.put("/", status_code=status.HTTP_200_OK)
async def update_noticia(
    noticia: Noticias = Depends(Noticias.from_form),
    imagenes: List[UploadFile] = File(...),
    rol: str = Depends(isEditorOrHigher),
    tokenId: int = Depends(getTokenId)
):
    try:
        validCategoria(noticia.categoria_id)

        userId = await db.fetch_val(
            "SELECT usuario_id FROM noticias WHERE id = :id", {"id": noticia.id}
        )
        if userId is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No existe la noticia que desea editar"
            )

        if rol == "editor" and tokenId != userId:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sin autorizacion para editar esta noticia"
            )
        async with db.transaction():
            query_update = """
            UPDATE noticias
            SET titulo = :titulo,
                contenido = :contenido,
                activo = :activo,
                categoria_id = :categoria_id,
                autor = :autor
            WHERE id = :id
            RETURNING id
            """

            values = noticia.model_dump()
            values["activo"] = False

            noticia_id = await db.fetch_val(query_update, values)
            if noticia_id is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Error al actualizar noticia"
                )

            if imagenes and len(imagenes) > 0:
                # Obtener rutas de imágenes antiguas
                query_select_imgs = """
                SELECT imagen FROM imagenes WHERE noticia_id = :noticia_id
                """
                imagenes_old_path = await db.fetch_all(
                    query_select_imgs, {"noticia_id": noticia_id}
                )

                # Eliminar archivos viejos del disco
                for old_img in imagenes_old_path:
                    if os.path.exists(old_img["imagen"]):
                        os.remove(old_img["imagen"])

                # Eliminar registros viejos de la base
                query_delete_imgs = """
                DELETE FROM imagenes WHERE noticia_id = :noticia_id
                """
                await db.execute(query_delete_imgs, {"noticia_id": noticia_id})

                # Insertar nuevas imágenes
                os.makedirs(UPLOAD_DIR, exist_ok=True)
                await insert_img(imagenes, noticia_id)

            return {"detail": "Noticia actualizada correctamente"}

    except HTTPException:
        raise
    except Exception as e:
        raise errorInterno(e)


@router.patch("/activo/{id}", status_code=status.HTTP_200_OK)
async def update_activo(id: int, _: bool = Depends(isPublicadorOrHigher)):
    try:
        result = await db.fetch_val(
            "UPDATE noticias SET activo = NOT activo WHERE id = :id RETURNING id",
            {"id": id}
        )

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Noticia inexistente"
            )

        return {"detail": "Estado de noticia actualizado correctamente"}

    except HTTPException:
        raise
    except Exception as e:
        raise errorInterno(e)


async def insert_img(imagenes, noticiaId: int):
    async with db.transaction():
        query_insert = """
        INSERT INTO imagenes(noticia_id, imagen, tipo_imagen)
        VALUES(:noticia_id, :imagen, :tipo_imagen)
        RETURNING id
        """
        os.makedirs(UPLOAD_DIR, exist_ok=True)

        for img in imagenes:
            original_name = os.path.basename(img.filename or f"unnamed_{noticiaId}.jpg")
            safe_filename = f"{uuid.uuid4().hex}_{original_name}"
            file_path = os.path.join(UPLOAD_DIR, safe_filename)

            # Guardar el archivo físico
            with open(file_path, "wb") as f:
                f.write(await img.read())

            # Normalizar la ruta (minúsculas + barras /)
            normalized_path = file_path.replace("\\", "/").lower()

            values = {
                "noticia_id": noticiaId,
                "imagen": normalized_path,
                "tipo_imagen": img.content_type
            }
            imagen_id = await db.fetch_val(query_insert, values)

            if imagen_id is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Error al guardar imágenes de noticia"
                )