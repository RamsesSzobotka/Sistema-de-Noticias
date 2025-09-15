from fastapi import HTTPException,status,Depends
from fastapi.security import OAuth2PasswordBearer
from dotenv import load_dotenv
from datetime import datetime,timezone,timedelta
from typing import cast
from typing import Dict, Any
import jwt
from jwt import PyJWTError, ExpiredSignatureError, InvalidTokenError
from DataBase.ConnectDB import db
import os
import bcrypt

oauth2 = OAuth2PasswordBearer(tokenUrl="auth/login")

load_dotenv()
try:
    SECRET_KEY= os.getenv("SECRET_KEY")
    ACCESS_TOKEN_EXPIRED_MINUTES = int(cast(str,os.getenv("ACCESS_TOKEN_EXPIRED_MINUTES")))
    REFRESH_TOKEN_EXPIRED_MINUTES = int(cast(str,os.getenv("REFRESH_TOKEN_EXPIRED_MINUTES")))
    ALGORITHM= cast(str,os.getenv("ALGORITHM"))
except ValueError:
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Error interno en el servidor")

def authToken(token: str = Depends(oauth2)):
    try:
        token_data = jwt.decode(token,SECRET_KEY,algorithms=[ALGORITHM])
        token_data["sub"] = int(token_data["sub"])
        return token_data
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token Expirado")
    except InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token invalido {e}")
    except PyJWTError:
         raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalido",
            headers={"WWW-Authenticate": "Bearer"}  
        )

    
def generateJWT(id : int ) -> str :
    playload = {
        "sub": str(id),
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRED_MINUTES)
    }
    return jwt.encode(playload,SECRET_KEY,algorithm=ALGORITHM)

def generateRefreshJWT(id: int )-> str:
    playload = {
        "sub": str(id),
        "type": "refresh",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=REFRESH_TOKEN_EXPIRED_MINUTES)
    }
    return jwt.encode(playload,SECRET_KEY,algorithm=ALGORITHM)

def refreshJWT(token: dict = Depends(authToken))-> str:
    try: 
        user_id = token.get("sub")
        
        if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token inválido: no contiene ID de usuario"
                )
        if user_id is None:
            raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token invalido",
                    headers={"WWW-Authenticate": "Bearer"}
                )
        return generateJWT(user_id)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Error interno del servidor")

def hashPassword(password: str) -> str:
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
    return hashed.decode()

async def isAdmin(token: Dict = Depends(authToken)) -> bool:
    try:
        user_id = token.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido: no contiene ID de usuario"
            )
        result = await getRol(user_id)
        if not result["rol"].lower() == "admin":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                                detail="No tienes permisos para realizar esta acción")
        return True
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )
async def isEditorOrHigher(token: Dict = Depends(authToken)) -> bool:
    try:
        user_id = token.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido: no contiene ID de usuario")
            
        result = await getRol(user_id)
        if not result["rol"].lower() in ["admin","supervisor","editor"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                                detail="No tienes permisos para realizar esta acción")
        return result["rol"]
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Error interno del servidor")  
                  
async def isPublicadorOrHigher(token: Dict = Depends(authToken))-> bool :
    try:
        user_id = token.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido: no contiene ID de usuario")
            
        result = await getRol(user_id)
        if not result["rol"].lower() in ["admin","supervisor"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                                detail="No tienes permisos para realizar esta acción")
        return True
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Error interno del servidor")
        
async def getRol(id: int):
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
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Error interno del servidor")            

def getTokenId(token:Dict = Depends(authToken)):
    user_id = token.get("sub")
    if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido: no contiene ID de usuario"
            )
    return user_id