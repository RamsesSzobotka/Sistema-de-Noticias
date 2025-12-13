from fastapi import APIRouter, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from models.userModel import Usuarios,Usuarios_admin
from core.security import isAdmin
from controllers import authController as Auth

router = APIRouter(prefix ="/auth",tags=["Autenticacion"])

#Login
@router.post("/login",status_code=status.HTTP_200_OK)
async def login(form : OAuth2PasswordRequestForm = Depends()):
    return await Auth.login(form)

#Registro de usuario comun
@router.post("/register",status_code=status.HTTP_201_CREATED)
async def register(user: Usuarios): 
    return await Auth.registerController(user)

#registro de usuarios de parte de administracion(comunes,editores,publicadores y otros adminsitradores)
@router.post("/admin/register",status_code=status.HTTP_201_CREATED)
async def registerAdmin(user: Usuarios_admin,_: bool = Depends(isAdmin)):
    return await Auth.registerAdminController(user)

#refrescar token
@router.post("/refresh")
async def refresh(refreshToken: str):
    return Auth.newTokenController(refreshToken)