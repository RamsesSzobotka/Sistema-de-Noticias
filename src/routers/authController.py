from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from passlib.context import CryptContext
from DataBase.ConnectDB import db
from DataBase.models.userModel import Usuarios
from utils.security import generate_JWT,generate_refresh_JWT

router = APIRouter(prefix ="/auth",tags=["Authentication"])

crypt = CryptContext(schemes=["bcrypt"])

LONGITUD_MINIMA = 8

@router.post("/login",status_code=status.HTTP_200_OK)
async def login(form : OAuth2PasswordRequestForm = Depends()):
    try:  
        query = "SELECT id,contrasena FROM usuarios WHERE usuario = :usuario"
        
        result = await db.fetch_one(query,{"usuario": form.username})
        
        if not result or not crypt.verify(form.password,result["contrasena"]):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail="Usuario o contraseña incorrectos")
        
        return {
            "access_token": generate_JWT(result["id"]),
            "refresh_token":generate_refresh_JWT(result["id"]),
            "token_type": "bearer"
        }
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Error interno en el servidor")  
        
@router.post("/register",status_code=status.HTTP_201_CREATED)
async def register(user: Usuarios): 
    try:
        query ="""INSERT INTO usuarios(nombre,apellido,usuario,contrasena,rol,activo) 
                VALUES(:nombre,:apellido,:usuario,:contrasena,:rol,:activo)
                RETURNING id"""
        values ={
            "nombre":user.nombre,
            "apellido":user.apellido,
            "usuario":user.usuario,
            "contrasena":crypt.hash(user.contrasena),
            "rol": user.rol,
            "activo": True
        }
        
        result = await db.execute(query,values)
        
        if result is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                               detail="Error al registrar usuario") 
            
        return {"detail":"Usuario registrado exitosamente"}    
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Error interno del servidor")