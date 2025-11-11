from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from dotenv import load_dotenv
from datetime import datetime, timezone, timedelta
from utils.infoVerify import searchUser
from utils.HttpError import errorInterno
from typing import cast, Dict
import jwt
from jwt import PyJWTError, ExpiredSignatureError, InvalidTokenError
from core.ConnectDB import db
import os
import bcrypt

oauth2 = OAuth2PasswordBearer(tokenUrl="auth/login")

load_dotenv()
try:
    SECRET_KEY = os.getenv("SECRET_KEY")
    ACCESS_TOKEN_EXPIRED_MINUTES = int(cast(str, os.getenv("ACCESS_TOKEN_EXPIRED_MINUTES")))
    REFRESH_TOKEN_EXPIRED_MINUTES = int(cast(str, os.getenv("REFRESH_TOKEN_EXPIRED_MINUTES")))
    ALGORITHM = cast(str, os.getenv("ALGORITHM"))
except ValueError:
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Error interno en el servidor"
    )


async def authToken(token: str = Depends(oauth2)):
    """
    Verifica y decodifica el token JWT de autenticación.

    Parámetros:
        token (str): Token JWT enviado en el encabezado Authorization.

    Retorna:
        dict: Información contenida en el token (payload).

    Lanza:
        HTTPException: Si el token ha expirado, es inválido o el usuario no existe.
    """
    try:
        tokenData = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        tokenData["sub"] = int(tokenData.get("sub", 0))

        if not tokenData["sub"]:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token sin 'sub' válido",
                headers={"WWW-Authenticate": "Bearer"}
            )

        if await searchUser(tokenData["sub"], 1) is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuario del token no existe",
                headers={"WWW-Authenticate": "Bearer"}
            )

        return tokenData

    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expirado",
            headers={"WWW-Authenticate": "Bearer"}
        )
    except (InvalidTokenError, PyJWTError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
            headers={"WWW-Authenticate": "Bearer"}
        )


def generateJWT(id: int) -> str:
    """
    Genera un token JWT de acceso.

    Parámetros:
        id (int): ID del usuario autenticado.

    Retorna:
        str: Token JWT codificado.
    """
    playload = {
        "sub": str(id),
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRED_MINUTES)
    }
    return jwt.encode(playload, SECRET_KEY, algorithm=ALGORITHM)


def generateRefreshJWT(id: int) -> str:
    """
    Genera un token JWT de tipo 'refresh'.

    Parámetros:
        id (int): ID del usuario autenticado.

    Retorna:
        str: Token JWT de actualización codificado.
    """
    playload = {
        "sub": str(id),
        "type": "refresh",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=REFRESH_TOKEN_EXPIRED_MINUTES)
    }
    return jwt.encode(playload, SECRET_KEY, algorithm=ALGORITHM)


def refreshJWT(token: dict = Depends(authToken)) -> str:
    """
    Genera un nuevo token de acceso a partir de un token válido.

    Parámetros:
        token (dict): Datos decodificados del token anterior.

    Retorna:
        str: Nuevo token JWT generado.

    Lanza:
        HTTPException: Si el token no contiene un ID de usuario o es inválido.
    """
    try:
        user_id = token.get("sub")

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido: no contiene ID de usuario"
            )

        return generateJWT(user_id)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )


def hashPassword(password: str) -> str:
    """
    Hashea una contraseña usando bcrypt.

    Parámetros:
        password (str): Contraseña en texto plano.

    Retorna:
        str: Contraseña hasheada.
    """
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
    return hashed.decode()


async def isAdmin(token: Dict = Depends(authToken)) -> bool:
    """
    Verifica si el usuario autenticado tiene el rol de administrador.

    Parámetros:
        token (dict): Token JWT decodificado.

    Retorna:
        bool: True si el usuario es administrador.

    Lanza:
        HTTPException: Si el usuario no es admin o el token es inválido.
    """
    try:
        user_id = token.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido: no contiene ID de usuario"
            )
        result = await getRol(user_id)
        if result["rol"].lower() != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para realizar esta acción"
            )
        return True
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )


async def isEditorOrHigher(token: Dict = Depends(authToken)) -> bool:
    """
    Verifica si el usuario tiene permisos de 'editor' o superiores.

    Roles válidos: admin, supervisor, editor.

    Parámetros:
        token (dict): Token JWT decodificado.

    Retorna:
        str: Rol del usuario si tiene permisos suficientes.

    Lanza:
        HTTPException: Si el usuario no tiene permisos o el token es inválido.
    """
    try:
        user_id = token.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido: no contiene ID de usuario"
            )

        result = await getRol(user_id)
        if result["rol"].lower() not in ["admin", "supervisor", "editor"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para realizar esta acción"
            )
        return result["rol"]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno del servidor: {e}"
        )


async def isPublicadorOrHigher(token: Dict = Depends(authToken)) -> bool:
    """
    Verifica si el usuario tiene permisos de 'publicador' o superiores.

    Roles válidos: admin, supervisor.

    Parámetros:
        token (dict): Token JWT decodificado.

    Retorna:
        bool: True si el usuario tiene permisos suficientes.

    Lanza:
        HTTPException: Si el usuario no tiene permisos o el token es inválido.
    """
    try:
        user_id = token.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido: no contiene ID de usuario"
            )

        result = await getRol(user_id)
        if result["rol"].lower() not in ["admin", "supervisor"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para realizar esta acción"
            )
        return True
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )


async def getRol(id: int):
    """
    Obtiene el rol de un usuario según su ID.

    Parámetros:
        id (int): ID del usuario.

    Retorna:
        dict: Rol del usuario.

    Lanza:
        HTTPException: Si el usuario no existe o hay error en la base de datos.
    """
    try:
        query = "SELECT rol FROM usuarios WHERE id = :id"
        result = await db.fetch_one(query, {"id": id})

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise errorInterno(e)


def getTokenId(token: Dict = Depends(authToken)):
    """
    Extrae el ID del usuario desde el token JWT.

    Parámetros:
        token (dict): Token JWT decodificado.

    Retorna:
        int: ID del usuario autenticado.

    Lanza:
        HTTPException: Si el token no contiene un ID válido.
    """
    user_id = token.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido: no contiene ID de usuario"
        )
    return user_id
