from fastapi import APIRouter, Query, HTTPException, status, Depends
from core.ConnectDB import db
from passlib.context import CryptContext
from schemas.userSchema import admin_user_schema, global_user_schema
from models.userModel import Usuarios
from core.security import getTokenId, isAdmin
from utils.infoVerify import searchUser, validContrasena, validRol, validUser
from utils.DbHelper import paginar, totalPages
from utils.HttpError import errorInterno  

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
    try:
        offset = paginar(page, size)
        condicion = {"size": size, "offset": offset}

        # Construir query base
       
        query = "SELECT * FROM usuarios "
        whereClause = ""
        #Aplicar filtros si se envio alguno
        if filtro.lower() != "todos":
            # Filtrar por estado activo/inactivo
            if filtro.lower() == "activo":
                whereClause = " WHERE activo = true "
            elif filtro.lower() == "inactivo":
                whereClause = " WHERE activo = false "
            # Filtrar por rol 
            elif validRol(filtro):
                whereClause = " WHERE rol = :rol "
                condicion["rol"] = filtro.lower()
            else:
                raise HTTPException(
                    status_code=status.HTTP_406_NOT_ACCEPTABLE,
                    detail=f"Filtro inválido: {filtro}"
                )
        query += whereClause
        query += "ORDER BY id LIMIT :size OFFSET :offset"

        usuarios = await db.fetch_all(query, condicion)

        if not usuarios:
            return {
                "page": page,
                "size": size,
                "total": 0,
                "total_pages": 0,
                "usuarios": []
            }

        totalQuery = f"""
            SELECT COUNT(*)
            FROM usuarios
            {whereClause}
        """

        total = await db.fetch_val(totalQuery)

        return {
            "page": page,
            "size": size,
            "total": total,
            "total_pages": totalPages(total, size),
            "usuarios": [admin_user_schema(row) for row in usuarios]
        }

    except HTTPException:
        raise
    except Exception:
        raise errorInterno()
    
# Obtener datos del usuario logueado
@router.get("/me", status_code=status.HTTP_200_OK)
async def getMe(userId: int = Depends(getTokenId)):
    try:
        userData = await validUser(userId,1)

        return global_user_schema(userData)
    except HTTPException:
        raise
    except Exception:
        raise errorInterno()

# Actualizar usuario logueado
@router.put("/me", status_code=status.HTTP_200_OK)
async def updateUser(user: Usuarios, userId: int = Depends(getTokenId)):
    try:
        await validUser(userId,1)

        existingUser = await searchUser(user.usuario, 2)
        if existingUser and existingUser["id"] != userId:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El nombre de usuario ya está en uso"
            )
        async with db.transaction():
            query = """
                UPDATE usuarios 
                SET nombre = :nombre, apellido = :apellido, usuario = :usuario 
                WHERE id = :id 
                RETURNING id
            """
            values = {
                "id": userId,
                "nombre": user.nombre,
                "apellido": user.apellido,
                "usuario": user.usuario
            }

            result = await db.fetch_val(query, values)

            if not result:
                raise errorInterno()

            return {"detail": "Usuario actualizado exitosamente"}
    except HTTPException:
        raise
    except Exception:
        raise errorInterno()


# Activar/Desactivar usuario (admin)
@router.patch("/activo/{id}", status_code=status.HTTP_200_OK)
async def updateActivo(id: int, _: bool = Depends(isAdmin)):
    try:
        async with db.transaction():
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
        raise errorInterno()


# Actualizar contraseña del usuario logueado
@router.patch("/me/pass", status_code=status.HTTP_200_OK)
async def updatePassword(password: str, newPassword: str, userId: int = Depends(getTokenId)):
    try:
        if not validContrasena(newPassword):
            raise HTTPException(
                status_code=status.HTTP_406_NOT_ACCEPTABLE,
                detail=(
                    "Contraseña invalida, introduzca una contraseña que contenga "
                    "8 caracteres mínimo y que incluya una letra mayúscula, "
                    "una minúscula, un número y un caracter especial (@$!%*?&). "
                    "Ejemplo: Hola123!"
                )
            )

        user = await validUser(userId,1)

        if not crypt.verify(password, user["contrasena"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="La contraseña actual no coincide"
            )
        async with db.transaction():
            query = "UPDATE usuarios SET contrasena = :contrasena WHERE id = :id RETURNING id"
            result = await db.fetch_val(
                query, {"contrasena": crypt.hash(newPassword), "id": userId}
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
        raise errorInterno()

@router.patch("/update/rol",status_code=status.HTTP_200_OK)
async def updateRol(id:int,rol:str,_:bool = Depends(isAdmin)):
    try:
        validRol(rol)
        user = await searchUser(id,1)
            
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail="Usuario inexistente")
        
        async with db.transaction():
            query = "UPDATE usuarios SET rol = :rol WHERE id = :id Returning id"
            
            result = await db.fetch_val(query,{"id":id,"rol":rol})
            
            if not result:
                raise errorInterno("Error al actualizar el rol, no se han realizado cambios")
            return {
                "detail":"Rol actualizado correctamente"
            }
    except HTTPException:
        raise
    except Exception:
        errorInterno()
    
# Buscar usuarios (admin o supervisor)
@router.get("/buscar", status_code=status.HTTP_200_OK)
async def buscarUsuarios(
    query: str = Query(..., min_length=1, description="Texto a buscar en nombre, apellido o usuario"),
    page: int = Query(1, ge=1, description="Número de página"),
    size: int = Query(10, ge=1, le=100, description="Cantidad de resultados por página"),
    _: bool = Depends(isAdmin)  # solo administradores pueden buscar
):
    try:
        offset = paginar(page, size)

        # Normalizamos el texto de búsqueda
        texto = f"%{query.lower()}%"

        # Query SQL usando ILIKE (PostgreSQL, para coincidencia sin distinción de mayúsculas)
        sql = """
            SELECT id, usuario, nombre, apellido, rol, activo, create_time , updated_at
            FROM usuarios
            WHERE LOWER(nombre) LIKE :texto
               OR LOWER(apellido) LIKE :texto
               OR LOWER(usuario) LIKE :texto
            ORDER BY id
            LIMIT :size OFFSET :offset
        """

        params = {"texto": texto, "size": size, "offset": offset}

        usuarios = await db.fetch_all(sql, params)

        if not usuarios:
            return {
                "page": page,
                "size": size,
                "total": 0,
                "total_pages": 0,
                "usuarios": []
            }

        # Total de coincidencias
        total_sql = """
            SELECT COUNT(*) 
            FROM usuarios 
            WHERE LOWER(nombre) LIKE :texto
               OR LOWER(apellido) LIKE :texto
               OR LOWER(usuario) LIKE :texto
        """
        total = await db.fetch_val(total_sql, {"texto": texto})

        return {
            "page": page,
            "size": size,
            "total": total,
            "total_pages": totalPages(total, size),
            "usuarios": [admin_user_schema(u) for u in usuarios]
        }

    except HTTPException:
        raise
    except Exception as e:
        raise errorInterno(e)