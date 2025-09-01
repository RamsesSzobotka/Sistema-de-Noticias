from fastapi import APIRouter, Query, HTTPException, status, Depends
from DataBase.ConnectDB import db
from passlib.context import CryptContext
from DataBase.schemas.userSchema import admin_user_schema, global_user_schema
from DataBase.models.userModel import Usuarios
from utils.security import get_token_id, isAdmin
from utils.infoVerify import search_user, valid_contrasena
from utils.DbHelper import paginar, total_pages
from utils.HttpError import error_interno  # 🔹 Import de tu helper

# Router
router = APIRouter(prefix="/usuarios", tags=["Usuarios"])

# Cifrado de contraseñas
crypt = CryptContext(schemes=["bcrypt"])


# Obtener todos los usuarios (solo admin)
@router.get("/", status_code=status.HTTP_200_OK)
async def get_users(
    page: int = Query(1, ge=1, description="Número de página"),
    size: int = Query(10, ge=1, le=100),
    _: bool = Depends(isAdmin)
):
    try:
        offset = paginar(page, size)

        query = "SELECT * FROM usuarios ORDER BY id LIMIT :size OFFSET :offset"
        usuarios = await db.fetch_all(query, {"size": size, "offset": offset})

        if not usuarios:
            return {"usuarios": []}

        total = await db.fetch_val("SELECT COUNT(*) FROM usuarios")

        return {
            "page": page,
            "size": size,
            "total": total,
            "total_pages": total_pages(total, size),
            "usuarios": [admin_user_schema(row) for row in usuarios]
        }
    except HTTPException:
        raise
    except Exception:
        raise error_interno()


# Obtener datos del usuario logueado
@router.get("/me", status_code=status.HTTP_200_OK)
async def get_me(user_id: int = Depends(get_token_id)):
    try:
        user_data = await search_user(user_id, 1)

        if user_data is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario inexistente"
            )

        return global_user_schema(user_data)
    except HTTPException:
        raise
    except Exception:
        raise error_interno()


# Actualizar usuario logueado
@router.put("/me", status_code=status.HTTP_200_OK)
async def update_user(user: Usuarios, user_id: int = Depends(get_token_id)):
    try:
        result = await search_user(user_id, 1)
        if result is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario inexistente"
            )

        existing_user = await search_user(user.usuario, 2)
        if existing_user and existing_user["id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El nombre de usuario ya está en uso"
            )

        query = """
            UPDATE usuarios 
            SET nombre = :nombre, apellido = :apellido, usuario = :usuario 
            WHERE id = :id 
            RETURNING id
        """
        values = {
            "id": user_id,
            "nombre": user.nombre,
            "apellido": user.apellido,
            "usuario": user.usuario
        }

        result = await db.execute(query, values)

        if result is None:
            raise error_interno()

        return {"detail": "Usuario actualizado exitosamente"}
    except HTTPException:
        raise
    except Exception:
        raise error_interno()


# Activar/Desactivar usuario (admin)
@router.patch("/activo/{id}", status_code=status.HTTP_200_OK)
async def update_activo(id: int, _: bool = Depends(isAdmin)):
    try:
        result = await db.fetch_val(
            "UPDATE usuarios SET activo = NOT activo WHERE id = :id RETURNING id",
            {"id": id}
        )

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario inexistente"
            )

        return {"detail": "Estado del usuario ha sido actualizado correctamente"}
    except HTTPException:
        raise
    except Exception:
        raise error_interno()


# Actualizar contraseña del usuario logueado
@router.patch("/me/pass", status_code=status.HTTP_200_OK)
async def update_password(password: str, new_password: str, user_id: str = Depends(get_token_id)):
    try:
        if not valid_contrasena(new_password):
            raise HTTPException(
                status_code=status.HTTP_406_NOT_ACCEPTABLE,
                detail=(
                    "Contraseña invalida, introduzca una contraseña que contenga "
                    "8 caracteres mínimo y que incluya una letra mayúscula, "
                    "una minúscula, un número y un caracter especial (@$!%*?&). "
                    "Ejemplo: Hola123!"
                )
            )

        user = await search_user(user_id, 1)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario inexistente"
            )

        if not crypt.verify(password, user["contrasena"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="La contraseña actual no coincide"
            )

        query = """
            UPDATE usuarios 
            SET contrasena = :contrasena 
            WHERE id = :id 
            RETURNING id
        """
        result = await db.execute(
            query, {"contrasena": crypt.hash(new_password), "id": user_id}
        )

        if not result:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se pudo actualizar la contraseña"
            )

        return {"detail": "Contraseña actualizada correctamente"}
    except HTTPException:
        raise
    except Exception:
        raise error_interno()
