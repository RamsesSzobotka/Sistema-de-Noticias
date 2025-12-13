from fastapi import APIRouter, Query, status, Depends
from passlib.context import CryptContext
from models.userModel import Usuarios
from core.security import getTokenId, isAdmin
from controllers import userController as User

# Router
router = APIRouter(prefix="/usuarios", tags=["Usuarios"])

# Cifrado de contraseñas
crypt = CryptContext(schemes=["bcrypt"])

@router.get("/", status_code=status.HTTP_200_OK)
async def getUsers(
    filtro: str = Query(
        "todos",
        description="Filtrar usuarios por: 'activo', 'inactivo', 'supervisor', 'editor', 'admin'"
    ),
    page: int = Query(1, ge=1, description="Número de página"),
    size: int = Query(10, ge=1, le=100, description="Cantidad de resultados por página"),
    _: bool = Depends(isAdmin)
):
    return await User.getUsers(filtro,page,size)
    
# Obtener datos del usuario logueado
@router.get("/me", status_code=status.HTTP_200_OK)
async def getMe(userId: int = Depends(getTokenId)):
    return await User.getMe(userId)

# Actualizar usuario logueado
@router.put("/me", status_code=status.HTTP_200_OK)
async def updateUser(user: Usuarios, userId: int = Depends(getTokenId)):
    return await User.updateUser(user,userId)

# Activar/Desactivar usuario (solo administradores)
@router.patch("/activo/{id}", status_code=status.HTTP_200_OK)
async def updateActivo(id: int, _: bool = Depends(isAdmin)):
   return await User.updateActivo(id)

# Actualizar contraseña del usuario logueado
@router.patch("/me/pass", status_code=status.HTTP_200_OK)
async def updatePassword(password: str, newPassword: str, userId: int = Depends(getTokenId)):
    return await User.updatePassword(password,newPassword,userId)

# Actualizar rol (solo administradores)
@router.patch("/update/rol",status_code=status.HTTP_200_OK)
async def updateRol(id:int,rol:str,_:bool = Depends(isAdmin)):
    return await User.updateRol(id,rol)
    
# Buscar usuarios (solo administradores)
@router.get("/buscar", status_code=status.HTTP_200_OK)
async def buscarUsuarios(
    query: str = Query(..., min_length=1, description="Texto a buscar en nombre, apellido o usuario"),
    page: int = Query(1, ge=1, description="Número de página"),
    size: int = Query(10, ge=1, le=100, description="Cantidad de resultados por página"),
    _: bool = Depends(isAdmin)
):
    return await User.buscarUsuarios(query,page,size)