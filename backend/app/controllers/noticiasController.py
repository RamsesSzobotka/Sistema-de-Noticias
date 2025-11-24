from fastapi import HTTPException, status
from core.ConnectDB import db
import os
from schemas.noticiasSchema import noticia_schema
from utils.infoVerify import searchNoticia, validImagenes, validCategoria, validUser
from utils.DbHelper import paginar, totalPages
from utils.imagen import insert_img, deleteImgsNoticia
from dotenv import load_dotenv

load_dotenv()
UPLOAD_DIR = os.getenv("UPLOAD_DIR")

async def getNoticiasController(filtro: str, page: int, size: int):
    try:
        offset = paginar(page, size)
        filtro = filtro.lower()

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

        if filtro != "todas":
            if filtro in ["deporte", "politica", "tecnologia", "entretenimiento"]:
                query += "WHERE LOWER(c.nombre) = :categoria AND n.activo = TRUE "
                condiciones["categoria"] = filtro # type: ignore
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

        result = await db.fetch_all(query, condiciones)

        if not result:
            return {
                "page": page,
                "size": size,
                "total": 0,
                "total_pages": 0,
                "noticias": [],
            }

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

async def getNoticiasAllController(page: int, size: int):
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
        raise HTTPException(status_code=500, detail=f"Error interno: {e}")

async def buscarNoticiasController(queryText: str, page: int, size: int):
    try:
        offset = paginar(page, size)
        texto = f"%{queryText.lower()}%"

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
                        ORDER BY i.id desc
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
              ) AND n.activo = TRUE
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
        raise HTTPException(status_code=500, detail=str(e))

async def buscarNoticiasAdminController(queryText: str, page: int, size: int):
    try:
        offset = paginar(page, size)
        texto = f"%{queryText.lower()}%"

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
                        ORDER BY i.id desc
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
        raise HTTPException(status_code=500, detail=str(e))
    
async def getNoticiaController(id: int):
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
    except Exception:
        raise HTTPException(status_code=500, detail="Error interno")


async def crearNoticiaController(noticia, imagenes, userId):
    try:
        validImagenes(imagenes)
        validCategoria(noticia.categoria_id)
        await validUser(userId, 1)

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
            if not noticia_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Error al crear la noticia"
                )

            os.makedirs(UPLOAD_DIR, exist_ok=True) # type: ignore
            await insert_img(imagenes, noticia_id)

            return {
                "detail": "Noticia creada exitosamente en espera de aprobación"
            }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def updateNoticiaController(noticia, imagenes, rol, tokenId):
    try:
        if noticia.id is None:
            raise HTTPException(
                status_code=status.HTTP_406_NOT_ACCEPTABLE,
                detail="Parametro ID vacío"
            )

        validCategoria(noticia.categoria_id)

        userId = await db.fetch_val(
            "SELECT usuario_id FROM noticias WHERE id = :id", {"id": noticia.id}
        )

        if userId is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No existe la noticia"
            )

        if rol == "editor" and tokenId != userId:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sin autorización"
            )

        async with db.transaction():
            queryUpdate = """
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

            noticia_id = await db.fetch_val(queryUpdate, values)
            if noticia_id is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Error al actualizar"
                )

            if imagenes is not None and len(imagenes) > 0:
                if len(imagenes) in (1, 2):
                    raise HTTPException(
                        status_code=status.HTTP_406_NOT_ACCEPTABLE,
                        detail="Mínimo 3 imágenes"
                    )

                await deleteImgsNoticia(noticia.id)
                await insert_img(imagenes, noticia.id)

            return {"detail": "Noticia actualizada correctamente"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def updateActivoController(id: int):
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

        return {"detail": "Estado actualizado"}

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Error interno")


async def deleteNoticiaController(id: int):
    try:
        if await searchNoticia(id) is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Noticia inexistente"
            )

        async with db.transaction():
            await deleteImgsNoticia(id)

            result = await db.fetch_val(
                "DELETE FROM noticias WHERE id = :id RETURNING id",
                {"id": id}
            )

            if not result:
                raise HTTPException(
                    status_code=500,
                    detail="Error al eliminar noticia"
                )

            return {"detail": "Noticia eliminada exitosamente"}

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Error interno")