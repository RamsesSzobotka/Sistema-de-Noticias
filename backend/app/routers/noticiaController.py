from fastapi import APIRouter,Query , HTTPException, status, Depends, UploadFile, File
from core.ConnectDB import db
import os
from typing import List
from models.noticiasModel import Noticias
from schemas.noticiasSchema import noticia_schema
from core.security import isEditorOrHigher, isPublicadorOrHigher, getTokenId
from utils.infoVerify import searchNoticia, validImagenes, validCategoria, validUser
from utils.HttpError import errorInterno
from utils.DbHelper import paginar,totalPages
from utils.imagen import insert_img
from dotenv import load_dotenv

router = APIRouter(prefix="/noticia", tags=["Noticias"])

load_dotenv()

UPLOAD_DIR = os.getenv("UPLOAD_DIR")

   
@router.get("/", status_code=status.HTTP_200_OK)
async def getNoticias(
    filtro: str = Query("todas",description="Filtros disponibles: 'deportes', 'politica', 'tecnologia', 'entretenimiento'"),
    page: int = Query(1, ge=1, description="Número de página"),
    size: int = Query(10, ge=1, le=100, description="Cantidad de resultados por página"),
):
    try:
        offset = paginar(page, size)
        filtro = filtro.lower() 

        # Base del query
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
        """

        condiciones = {"size": size, "offset": offset}

        # Filtros dinámicos
        if filtro != "todas":
            if filtro in ["deportes", "politica", "tecnologia", "entretenimiento"]:
                query += "WHERE LOWER(c.nombre) = :categoria AND n.activo = TRUE "
                condiciones["categoria"] = filtro
            else:
                raise HTTPException(
                    status_code=status.HTTP_406_NOT_ACCEPTABLE,
                    detail=f"Filtro inválido: {filtro}"
                )
        else:
            query += "WHERE n.activo = TRUE "

        query += """
            GROUP BY n.id, c.id, u.id
            ORDER BY n.fecha_creacion DESC
            LIMIT :size OFFSET :offset;
        """

        # Ejecutar consulta
        result = await db.fetch_all(query, condiciones)

        # Si no hay resultados
        if not result:
            return {
                "page": page,
                "size": size,
                "total": 0,
                "total_pages": 0,
                "noticias": [],
            }

        # Total de noticias activas (solo cuenta las que cumplen el filtro si aplica)
        if filtro != "todas":
            total = await db.fetch_val(
                "SELECT COUNT(*) FROM noticias n JOIN categorias c ON n.categoria_id = c.id "
                "WHERE LOWER(c.nombre) = :categoria AND n.activo = TRUE",
                {"categoria": filtro}
            )
        else:
            total = await db.fetch_val("SELECT COUNT(*) FROM noticias WHERE activo = TRUE")

        return {
            "page": page,
            "size": size,
            "total": total,
            "total_pages": totalPages(total, size),
            "noticias": [noticia_schema(row) for row in result],
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {e}")

@router.get("/all", status_code=status.HTTP_200_OK)
async def getNoticiasAll(
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

@router.get("/buscar", status_code=status.HTTP_200_OK)
async def buscarNoticias(
    query: str = Query(..., min_length=1, description="Texto a buscar en título, contenido o autor"),
    page: int = Query(1, ge=1, description="Número de página"),
    size: int = Query(10, ge=1, le=100, description="Cantidad de resultados por página"),
):
    try:
        offset = paginar(page, size)
        texto = f"%{query.lower()}%"

        sql = """
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
            WHERE (
                    LOWER(n.titulo) LIKE :texto
                 OR LOWER(n.contenido) LIKE :texto
                 OR LOWER(n.autor) LIKE :texto
              )
            GROUP BY n.id, c.id, u.id
            ORDER BY n.fecha_creacion DESC
            LIMIT :size OFFSET :offset;
        """

        params = {"texto": texto, "size": size, "offset": offset}
        result = await db.fetch_all(sql, params)

        if not result:
            return {
                "page": page,
                "size": size,
                "total": 0,
                "total_pages": 0,
                "noticias": [],
            }

        total_sql = """
            SELECT COUNT(*)
            FROM noticias n
            WHERE (
                    LOWER(n.titulo) LIKE :texto
                 OR LOWER(n.contenido) LIKE :texto
                 OR LOWER(n.autor) LIKE :texto
              )
        """
        total = await db.fetch_val(total_sql, {"texto": texto})

        return {
            "page": page,
            "size": size,
            "total": total,
            "total_pages": totalPages(total, size),
            "noticias": [noticia_schema(row) for row in result],
        }

    except HTTPException:
        raise
    except Exception as e:
        raise errorInterno(e)


@router.get("/{id}", status_code=status.HTTP_200_OK)
async def getNoticia(id: int):
    try:
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
            WHERE n.id = :id
            GROUP BY n.id, c.id, u.id;
        """

        result = await db.fetch_one(query, {"id": id})

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Noticia no encontrada"
            )

        return noticia_schema(result)

    except HTTPException:
        raise
    except Exception as e:
        raise errorInterno()

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
    imagenes: List[UploadFile] = File(None),
    rol: str = Depends(isEditorOrHigher),
    tokenId: int = Depends(getTokenId)
):
    try:
        if noticia.id is None:
            raise HTTPException(status_code=status.HTTP_406_NOT_ACCEPTABLE,
                                detail="Parametro ID vacio, es obligatorio enviar el ID")
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

            if imagenes:
                # Si hay imágenes, verificar cantidad válida
                if len(imagenes) in (1, 2):
                    raise HTTPException(
                        status_code=status.HTTP_406_NOT_ACCEPTABLE,
                        detail="Cantidad de imágenes inválida, se necesitan mínimo 3 si desea actualizarlas"
                        )

                # Borrar imágenes viejas y subir nuevas
                query_select_imgs = "SELECT imagen FROM imagenes WHERE noticia_id = :noticia_id"
                imagenes_old_path = await db.fetch_all(query_select_imgs, {"noticia_id": noticia.id})

                for old_img in imagenes_old_path:
                    if os.path.exists(old_img["imagen"]):
                        os.remove(old_img["imagen"])

                await db.execute("DELETE FROM imagenes WHERE noticia_id = :noticia_id", {"noticia_id": noticia.id})
                await insert_img(imagenes, noticia.id)

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
    
@router.delete("/",status_code=status.HTTP_200_OK)
async def deleteNoticia(id: int, _:bool = Depends(isPublicadorOrHigher)):
    try:
        if await searchNoticia(id) is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail="Noticia inexistente")
        
        async with db.transaction():
            query = "DELETE FROM noticias WHERE id = :id RETURNING id"
            
            result = await db.fetch_val(query,{"id": id})
            
            if not result:
                raise errorInterno("Error al eliminar noticia, la noticia no fue eliminada")
            
            return {
                "detail": "Noticia eliminada exitosamente"
            }
            
    except HTTPException:
        raise 
    except Exception:
        errorInterno()