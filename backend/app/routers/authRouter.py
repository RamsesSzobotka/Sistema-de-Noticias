from fastapi import APIRouter, status, Depends, Response
from fastapi.security import OAuth2PasswordRequestForm
from models.userModel import Usuarios, Usuarios_admin
from core.security import isAdmin, authToken
from controllers import authController as Auth

router = APIRouter(prefix="/auth", tags=["Autenticacion"])

@router.post("/login", status_code=status.HTTP_200_OK)
async def login(form: OAuth2PasswordRequestForm = Depends(), response: Response = None):
    return await Auth.login(form, response)

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user: Usuarios, response: Response = None):
    return await Auth.registerController(user, response)

@router.post("/admin/register", status_code=status.HTTP_201_CREATED)
async def registerAdmin(user: Usuarios_admin, _: bool = Depends(isAdmin)):
    return await Auth.registerAdminController(user)

@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(response: Response):
    response.delete_cookie(key="access_token", path="/")
    return {"detail": "Sesion cerrada"}