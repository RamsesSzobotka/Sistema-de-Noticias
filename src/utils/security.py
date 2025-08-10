from fastapi import HTTPException,status,Depends
from fastapi.security import OAuth2PasswordBearer
from dotenv import load_dotenv
from datetime import datetime,timezone,timedelta
from typing import cast
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

def auth_token(token: str = Depends(oauth2)):
    try:
        token_data = jwt.decode(token,SECRET_KEY,[ALGORITHM])
        return token_data
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token Expirado")
    except InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalido")
    except PyJWTError:
         raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalido",
            headers={"WWW-Authenticate": "Bearer"}  # Informa al cliente que debe autenticarse con Bearer
        )

    
def generate_JWT(id : int ) -> str :
    playload = {
        "sub": id,
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRED_MINUTES)
    }
    return jwt.encode(playload,SECRET_KEY,algorithm=ALGORITHM)

def generate_refresh_JWT(id: int )-> str:
    playload = {
        "sub": id,
        "type": "refresh",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=REFRESH_TOKEN_EXPIRED_MINUTES)
    }
    return jwt.encode(playload,SECRET_KEY,algorithm=ALGORITHM)

def refresh_JWT(token: str = Depends(auth_token))-> str:
    user_id = token.get("sub") # type: ignore
    
    if user_id is None:
        raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token invalido",
                headers={"WWW-Authenticate": "Bearer"}
            )
    return generate_JWT(user_id)

def hash_password(password: str) -> str:
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
    return hashed.decode()

async def isAdmin(id: int)-> bool:
    try:
        query ="select rol from usuarios where id = :id"
        result = await db.fetch_one(query,{"id":"id"})
        if result and not result["rol"] == "admin": 
            return False
        return True
    except Exception:
        raise