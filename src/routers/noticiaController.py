from fastapi import APIRouter,Query , HTTPException, status, Depends, UploadFile, File
from DataBase.ConnectDB import db
import os
import uuid
from typing import List
from DataBase.models.noticiasModel import Noticias
from DataBase.schemas.noticiasSchema import noticia_schema
from utils.security import isAdmin, isEditorOrHigher, isPublicadorOrHigher, get_token_id, get_rol
from utils.infoVerify import valid_imagenes, valid_categoria, valid_user
from utils.HttpError import error_interno
from utils.DbHelper import paginar,total_pages

router = APIRouter(prefix="/noticia", tags=["Noticias"])

UPLOAD_DIR = "ImagenesDB"


@router.get("/", status_code=status.HTTP_200_OK)
async def get_noticias(
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
            u.usuario as usuario_nombre,
            n.autor
        FROM noticias n
        JOIN categorias c ON n.categoria_id = c.id
        JOIN usuarios u ON n.usuario_id = u.id
        WHERE activo = TRUE
        LIMIT :size OFFSET :offset
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

        total = await db.fetch_val("SELECT COUNT(*) FROM noticias")
        return {
            "page": page,
            "size": size,
            "total":total,
            "total_pages": total_pages(total, size),
            "usuarios": [noticia_schema(row) for row in result]
        }

    except HTTPException:
        raise
    except Exception:
        raise error_interno()

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
            u.usuario as usuario_nombre,
            n.autor
        FROM noticias n
        JOIN categorias c ON n.categoria_id = c.id
        JOIN usuarios u ON n.usuario_id = u.id
        ORDER BY n.fecha_creacion DESC
        LIMIT :size OFFSET :offset
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
            "total_pages": total_pages(total, size),
            "noticias": [noticia_schema(row) for row in result]
        }

    except HTTPException:
        raise
    except Exception:
        raise error_interno()

@router.post("/")
async def crear_noticia(
    noticia: Noticias = Depends(Noticias.from_form),
    imagenes: List[UploadFile] = File(...),
    user_id: int = Depends(get_token_id),
    _: bool = Depends(isEditorOrHigher)
):
    try:
        valid_imagenes(imagenes)
        valid_categoria(noticia.categoria_id)
        await valid_user(user_id,1)

        query = """
        INSERT INTO noticias(titulo,contenido,activo,categoria_id,usuario_id,autor)
        VALUES (:titulo,:contenido,:activo,:categoria_id,:usuario_id,:autor)
        RETURNING id
        """

        values = noticia.model_dump()
        del values["id"]
        values["usuario_id"] = user_id
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
    except Exception:
        raise error_interno()


@router.put("/", status_code=status.HTTP_200_OK)
async def update_noticia(
    noticia: Noticias = Depends(Noticias.from_form),
    imagenes: List[UploadFile] = File(...),
    rol: str = Depends(isEditorOrHigher),
    token_id: int = Depends(get_token_id)
):
    try:
        valid_categoria(noticia.categoria_id)

        user_id = await db.fetch_val(
            "SELECT usuario_id FROM noticias WHERE id = :id", {"id": noticia.id}
        )
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No existe la noticia que desea editar"
            )

        if rol == "editor" and token_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sin autorizacion para editar esta noticia"
            )

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
    except Exception:
        raise error_interno()


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
    except Exception:
        raise error_interno()


async def insert_img(imagenes, noticia_id: int):
    query_insert = """
    INSERT INTO imagenes(noticia_id, imagen, tipo_imagen)
    VALUES(:noticia_id, :imagen, :tipo_imagen)
    RETURNING id
    """
    os.makedirs(UPLOAD_DIR, exist_ok=True)  # evitar duplicación de mkdir

    for img in imagenes:
        # Nombre único y seguro
        original_name = os.path.basename(img.filename or f"unnamed_{noticia_id}.jpg")
        safe_filename = f"{uuid.uuid4().hex}_{original_name}"
        file_path = os.path.join(UPLOAD_DIR, safe_filename)

        with open(file_path, "wb") as f:
            f.write(await img.read())

        values = {
            "noticia_id": noticia_id,
            "imagen": file_path,
            "tipo_imagen": img.content_type
        }
        imagen_id = await db.fetch_val(query_insert, values)

        if imagen_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Error al guardar imágenes de noticia"
            )