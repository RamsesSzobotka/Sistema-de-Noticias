from fastapi import HTTPException, status
from core.ConnectDB import db
import os
import re
from dotenv import load_dotenv
from utils.HttpError import errorInterno

load_dotenv()

VALID_ROL = os.getenv("VALID_ROL", "").strip().split(",")


async def validUsername(username: str):
    """
    Valida el nombre de usuario y verifica si ya existe en la base de datos.

    Parámetros:
        username (str): Nombre de usuario a validar.

    Reglas:
        - No puede exceder los 12 caracteres.
        - No debe estar ya registrado.

    Lanza:
        HTTPException: Si el usuario es muy largo o ya está en uso.
    """
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
    """
    Valida si el rol proporcionado es válido según las opciones del entorno.

    Parámetros:
        rol (str): Rol a verificar.

    Retorna:
        bool: True si el rol es válido.

    Lanza:
        HTTPException: Si el rol no está permitido.
    """
    if rol not in VALID_ROL:
        raise HTTPException(
            status_code=status.HTTP_406_NOT_ACCEPTABLE,
            detail="Rol invalido"
        )
    return True


async def searchUser(data: str | int, option: int):
    """
    Busca un usuario en la base de datos por ID o nombre de usuario.

    Parámetros:
        data (str | int): Dato de búsqueda (ID o nombre).
        option (int): Modo de búsqueda.
                      1 = por ID,
                      2 = por nombre de usuario.

    Retorna:
        dict | None: Datos del usuario si existe, None si no.

    Lanza:
        HTTPException: Si la opción o el dato son inválidos.
    """
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


def validContrasena(password: str ) -> bool:
    """
    Verifica si una contraseña cumple los criterios de seguridad.

    Requisitos:
        - Mínimo 8 caracteres.
        - Al menos una letra mayúscula.
        - Al menos una letra minúscula.
        - Al menos un número.
        - Al menos un carácter especial (@$!%*?&).

    Parámetros:
        password (str): Contraseña en texto plano.

    Retorna:
        bool: True si la contraseña es válida.
    """
    pattern = re.compile(
        r'^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$'
    )
    return bool(pattern.match(password))


def validImagenes(imagenes):
    """
    Valida que se hayan subido imágenes y que tengan formatos permitidos.

    Parámetros:
        imagenes (list): Lista de archivos de imagen.

    Reglas:
        - Debe existir al menos una imagen.
        - Tipos permitidos: image/jpeg, image/png, image/webp.

    Lanza:
        HTTPException: Si no hay imágenes o si el tipo de archivo no es válido.
    """
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
    """
    Valida que la categoría esté dentro del rango permitido.

    Parámetros:
        categoria (int): ID de categoría (1-4 permitido).

    Lanza:
        HTTPException: Si la categoría es inválida.
    """
    if not categoria or not (1 <= categoria <= 4):
        raise HTTPException(
            status_code=status.HTTP_406_NOT_ACCEPTABLE,
            detail="Categoría inválida"
        )


async def searchNoticia(id: int):
    """
    Busca una noticia en la base de datos por su ID.

    Parámetros:
        id (int): ID de la noticia.

    Retorna:
        dict | None: Noticia encontrada o None si no existe.

    Lanza:
        HTTPException: Si ocurre un error al consultar.
    """
    try:
        query = "SELECT * FROM noticias WHERE id = :id"
        return await db.fetch_one(query, {"id": id})
    except Exception as e:
        raise errorInterno(e)


async def validUser(id: int, option: int):
    """
    Valida que un usuario exista y esté activo.

    Parámetros:
        id (int): Identificador del usuario.
        option (int): Modo de búsqueda (1 = ID, 2 = nombre de usuario).

    Retorna:
        dict: Información del usuario válido.

    Lanza:
        HTTPException: Si el usuario no existe o está desactivado.
    """
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
    """
    Valida que una noticia exista y esté activa.

    Parámetros:
        noticia_id (int): ID de la noticia.

    Retorna:
        dict: Información de la noticia válida.

    Lanza:
        HTTPException: Si la noticia no existe o está desactivada.
    """
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
    """
    Valida la existencia de un comentario padre (si se especifica).

    Parámetros:
        id (int | None): ID del comentario padre, o None si no aplica.

    Retorna:
        dict | None: Datos del comentario padre o None si no se indicó.

    Lanza:
        HTTPException: Si el comentario padre no existe.
    """
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