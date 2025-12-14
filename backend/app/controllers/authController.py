from fastapi import HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from passlib.context import CryptContext
from utils.HttpError import errorInterno
from core.ConnectDB import db
from models.userModel import Usuarios,Usuarios_admin
from core.security import generateJWT,generateRefreshJWT,refreshJWT
from utils.infoVerify import searchUser,validUsername,validRol,validContrasena

crypt = CryptContext(schemes=["bcrypt"])

async def login(form : OAuth2PasswordRequestForm):
    try:  
        result = await searchUser(form.username,2)
    
        if not result or not crypt.verify(form.password,result["contrasena"]):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail="Usuario o contraseña incorrectos")
        if not result["activo"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                                detail="Usuario desabilitado por un adminsitrador")
        return {
            "access_token": generateJWT(result["id"]),
            "refresh_token":generateRefreshJWT(result["id"]),
            "token_type": "bearer"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise errorInterno()
        
async def registerController(user: Usuarios): 
    try:
        async with db.transaction():
            await validUsername(user.usuario)
            if user.contrasena is None or not validContrasena(user.contrasena):
                raise HTTPException(status_code=status.HTTP_406_NOT_ACCEPTABLE,
                                    detail="Contraseña invalida,introduzca una contraseña que contenga 8 caracteres minimo y que incluya una letra mayuscula,una minuscula,un numero y un caracter especial(@$!%*?&),ejemplo: Hola123!")
            
            query ="""INSERT INTO usuarios(nombre,apellido,usuario,contrasena,rol,activo) 
                    VALUES(:nombre,:apellido,:usuario,:contrasena,:rol,:activo)
                    RETURNING id"""
            values ={
                "nombre":user.nombre,
                "apellido":user.apellido,
                "usuario":user.usuario,
                "contrasena":crypt.hash(user.contrasena),
                "rol": "global",
                "activo": True
            }
            
            result = await db.fetch_one(query,values)
            
            if result is None:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail="Error al registrar usuario") 
                
            return {"detail":"Usuario registrado exitosamente"}    
    except HTTPException:
        raise
    except Exception:
        raise errorInterno()
    
async def registerAdminController(user: Usuarios_admin):
    try:
        async with db.transaction():
            await validUsername(user.usuario)
            
            if user.contrasena is None or not validContrasena(user.contrasena) :
                raise HTTPException(status_code=status.HTTP_406_NOT_ACCEPTABLE,
                                    detail="Contraseña invalida,introduzca una contraseña que contenga 8 caracteres minimo y que incluya una letra mayuscula,una minuscula,un numero y un caracter especial(@$!%*?&),ejemplo: Hola123!")
            validRol(user.rol)
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
            
            result = await db.fetch_one(query,values)
            
            if result is None:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail="Error al registrar usuario") 
                
            return {"detail":"Usuario registrado exitosamente"}    
    except HTTPException:
        raise
    except Exception:
        raise errorInterno()

def newTokenController(refreshToken: str):
    """
    Controlador para generar un nuevo access token desde un refresh token.
    """
    try:
        if not refreshToken:
            raise HTTPException(
                status_code=400,
                detail="No se envió refresh token"
            )

        # Llamamos la función que valida y genera el nuevo token
        return refreshJWT(refreshToken)

    except HTTPException:
        raise
    except Exception as e:
        raise errorInterno(e)
