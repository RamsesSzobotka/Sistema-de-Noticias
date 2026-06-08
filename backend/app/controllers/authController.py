from fastapi import HTTPException, status, Response
from fastapi.security import OAuth2PasswordRequestForm
from passlib.context import CryptContext
from utils.HttpError import errorInterno
from core.ConnectDB import db
from models.userModel import Usuarios, Usuarios_admin
from core.security import generateJWT
from utils.infoVerify import searchUser, validUsername, validRol, validContrasena

crypt = CryptContext(schemes=["bcrypt"])

COOKIE_MAX_AGE = 7 * 24 * 60 * 60

def _set_session_cookie(response: Response, user_id: int) -> None:
    token = generateJWT(user_id)
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
        max_age=COOKIE_MAX_AGE,
    )

async def login(form: OAuth2PasswordRequestForm, response: Response):
    try:
        result = await searchUser(form.username, 2)

        if not result or not crypt.verify(form.password, result["contrasena"]):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail="Usuario o contraseña incorrectos")
        if not result["activo"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                                detail="Usuario deshabilitado por un administrador")

        _set_session_cookie(response, result["id"])
        return {
            "id": result["id"],
            "usuario": result["usuario"],
            "rol": result["rol"],
        }
    except HTTPException:
        raise
    except Exception:
        raise errorInterno()

async def registerController(user: Usuarios, response: Response):
    try:
        async with db.transaction():
            await validUsername(user.usuario)
            if user.contrasena is None or not validContrasena(user.contrasena):
                raise HTTPException(status_code=status.HTTP_406_NOT_ACCEPTABLE,
                                    detail="Contrasena invalida, introduzca una contrasena que contenga 8 caracteres minimo y que incluya una letra mayuscula, una minuscula, un numero y un caracter especial (@$!%*?&)")

            query = """INSERT INTO usuarios(nombre,apellido,usuario,contrasena,rol,activo)
                       VALUES(:nombre,:apellido,:usuario,:contrasena,:rol,:activo)
                       RETURNING id"""
            values = {
                "nombre": user.nombre,
                "apellido": user.apellido,
                "usuario": user.usuario,
                "contrasena": crypt.hash(user.contrasena),
                "rol": "global",
                "activo": True,
            }

            result = await db.fetch_one(query, values)
            if result is None:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                    detail="Error al registrar usuario")

            _set_session_cookie(response, result["id"])
            return {"detail": "Usuario registrado exitosamente",
                    "id": result["id"],
                    "usuario": user.usuario,
                    "rol": "global"}
    except HTTPException:
        raise
    except Exception:
        raise errorInterno()

async def registerAdminController(user: Usuarios_admin):
    try:
        async with db.transaction():
            await validUsername(user.usuario)
            if user.contrasena is None or not validContrasena(user.contrasena):
                raise HTTPException(status_code=status.HTTP_406_NOT_ACCEPTABLE,
                                    detail="Contrasena invalida, introduzca una contrasena que contenga 8 caracteres minimo y que incluya una letra mayuscula, una minuscula, un numero y un caracter especial (@$!%*?&)")
            validRol(user.rol)

            query = """INSERT INTO usuarios(nombre,apellido,usuario,contrasena,rol,activo)
                       VALUES(:nombre,:apellido,:usuario,:contrasena,:rol,:activo)
                       RETURNING id"""
            values = {
                "nombre": user.nombre,
                "apellido": user.apellido,
                "usuario": user.usuario,
                "contrasena": crypt.hash(user.contrasena),
                "rol": user.rol,
                "activo": True,
            }

            result = await db.fetch_one(query, values)
            if result is None:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                    detail="Error al registrar usuario")

            return {"detail": "Usuario registrado exitosamente"}
    except HTTPException:
        raise
    except Exception:
        raise errorInterno()
