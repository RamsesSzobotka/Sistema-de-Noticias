from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from passlib.context import CryptContext
from core.ConnectDB import db
from models.userModel import Usuarios,Usuarios_admin
from core.security import generateJWT,generateRefreshJWT,isAdmin
from utils.infoVerify import searchUser,validUsername,validRol,validContrasena

router = APIRouter(prefix ="/auth",tags=["Autenticacion"])

crypt = CryptContext(schemes=["bcrypt"])

@router.post("/login",status_code=status.HTTP_200_OK)
async def login(form : OAuth2PasswordRequestForm = Depends()):
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
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Error interno en el servidor")  
        
@router.post("/register",status_code=status.HTTP_201_CREATED)
async def register(user: Usuarios): 
    try:
        await validUsername(user.usuario)
        async with db.transaction():
            if not validContrasena(user.contrasena) :
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
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Error interno del servidor")
        
@router.post("/admin/register",status_code=status.HTTP_201_CREATED)
async def registerAdmin(user: Usuarios_admin,_: bool = Depends(isAdmin)):
    try:
        await validUsername(user.usuario)
        
        if not validContrasena(user.contrasena) :
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
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Error interno del servidor")