from fastapi import HTTPException, status
from DataBase.ConnectDB import db
import os
import re
from dotenv import load_dotenv
from utils.HttpError import errorInterno

load_dotenv()

VALID_ROL = os.getenv("VALID_ROL", "").strip().split(",")


async def validUsername(username: str):
    try:
        if len(username) > 12:
            raise HTTPException(
                status_code=status.HTTP_406_NOT_ACCEPTABLE,
                detail="El usuario debe tener menos de 12 caracteres"
            )
        result = await searchUser(username, 2)
        if result:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Usuario ya en uso"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise errorInterno(e)


def validRol(rol: str):
    if rol not in VALID_ROL:
        raise HTTPException(
            status_code=status.HTTP_406_NOT_ACCEPTABLE,
            detail="Rol invalido"
        )


async def searchUser(data: str | int, option: int):
    try:
        match option:
            case 1:
                try:
                    value = int(data)
                except ValueError:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="ID inválido"
                    )
                condicion = "id"
            case 2:
                value = data
                condicion = "usuario"
            case _:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Opción de búsqueda inválida"
                )

        query = f"""
            SELECT *
            FROM usuarios 
            WHERE {condicion} = :{condicion}
        """
        result = await db.fetch_one(query, {condicion: value})
        return result

    except HTTPException:
        raise
    except Exception as e:
        raise errorInterno(e)


def validContrasena(password: str) -> bool:
    pattern = re.compile(
        r'^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$'
    )
    return bool(pattern.match(password))


def validImagenes(imagenes):
    if not imagenes or len(imagenes) == 0:
        raise HTTPException(
            status_code=status.HTTP_406_NOT_ACCEPTABLE,
            detail="Debes subir al menos una imagen"
        )

    tipos_permitidos = ["image/jpeg", "image/png", "image/webp"]
    for img in imagenes:
        if img.content_type not in tipos_permitidos:
            raise HTTPException(
                status_code=status.HTTP_406_NOT_ACCEPTABLE,
                detail=f"Tipo de imagen no permitido: {img.content_type}"
            )


def validCategoria(categoria: int):
    if not categoria or not (1 <= categoria <= 4):
        raise HTTPException(
            status_code=status.HTTP_406_NOT_ACCEPTABLE,
            detail="Categoría inválida"
        )


async def searchNoticia(id: int):
    try:
        query = "SELECT * FROM noticias WHERE id = :id"
        return await db.fetch_one(query, {"id": id})
    except Exception as e:
        raise errorInterno(e)


async def validUser(id: int, option: int):
    try:
        user = await searchUser(id, option)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario inexistente"
            )
        if not user["activo"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuario desactivado por un administrador"
            )
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise errorInterno(e)


async def validNoticia(noticia_id: int):
    try:
        noticia = await searchNoticia(noticia_id)
        if noticia is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Noticia inexistente"
            )
        if not noticia["activo"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Noticia desactivada por un administrador"
            )
        return noticia
    except HTTPException:
        raise
    except Exception as e:
        raise errorInterno(e)


async def validComentarioPadre(id: int | None):
    if id is None:
        return None
    try:
        comentario_padre = await db.fetch_one(
            "SELECT id FROM comentarios WHERE id = :id",
            {"id": id}
        )
        if comentario_padre is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Comentario padre inexistente"
            )
        return comentario_padre
    except HTTPException:
        raise
    except Exception as e:
        raise errorInterno(e)
