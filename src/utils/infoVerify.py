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
    result = await search_user(username)
    if result:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail="Usuario ya en uso")

def valid_rol(rol:str):
    if not rol in VALID_ROL:
        raise HTTPException(status_code=status.HTTP_406_NOT_ACCEPTABLE,
                            detail="Rol invalido")

async def search_user(username:str ):
    try:
        query = "SELECT id,contrasena,activo FROM usuarios WHERE usuario = :usuario"
        result = await db.fetch_one(query,{"usuario": username})
        return result
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Error interno del servidor")

def valid_contrasena(password: str) -> bool:
    pattern = re.compile(
        r'^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$'
    )
    return bool(pattern.match(password))