from fastapi import HTTPException,status
from DataBase.models.userModel import Usuarios
from DataBase.ConnectDB import db
import os
import re
from dotenv import load_dotenv

load_dotenv()

VALID_ROL= os.getenv("VALID_ROL","").strip().split(",")

async def valid_username(username: str):
    if len(username) > 12 :
        raise HTTPException(status_code=status.HTTP_406_NOT_ACCEPTABLE,
                            detail="El usuario debe tener menos de 12 caracteres")
    result = await search_user(username,2)
    if result:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail="Usuario ya en uso")

def valid_rol(rol:str):
    if not rol in VALID_ROL:
        raise HTTPException(status_code=status.HTTP_406_NOT_ACCEPTABLE,
                            detail="Rol invalido")

async def search_user(data: str | int, option: int):
    try:
        match option:
            case 1:
                try:
                    value = int(data)
                except ValueError:
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                        detail="ID inválido")
                condicion = "id"
            case 2:
                value = data
                condicion = "usuario"
            case _:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                    detail="Opción de búsqueda inválida")
        
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor" + f" {e}"
        )


def valid_contrasena(password: str) -> bool:
    pattern = re.compile(
        r'^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$'
    )
    return bool(pattern.match(password))

def valid_imagenes(imagenes):
    if not imagenes or len(imagenes) == 0:
        raise HTTPException(status_code=status.HTTP_406_NOT_ACCEPTABLE,
                            detail="Debes subir al menos una imagen")

    tipos_permitidos = ["image/jpeg", "image/png", "image/webp"]
    for img in imagenes:
        if img.content_type not in tipos_permitidos:
            raise HTTPException(status_code=status.HTTP_406_NOT_ACCEPTABLE,
                                detail=f"Tipo de imagen no permitido: {img.content_type}")

def valid_categoria(categoria: int):
    if not categoria or not categoria < 1 and categoria > 5:
        raise HTTPException(status_code=status.HTTP_406_NOT_ACCEPTABLE,
                            detail="Categoría inválida")

async def search_noticia(id:int):
    try:
        query = "Select * FROM noticias Where id = :id"
        
        return await db.fetch_one(query,{"id":id})
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Error interno del servidor")
        
async def valid_user(id:int,option:int):
    user = await search_user(id,option)
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
    
async def valid_noticia(noticia_id: int):
    noticia = await search_noticia(noticia_id)
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

async def valid_comentario_padre(id: int | None):
    if id is None:
        return None  

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
    