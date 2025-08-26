from fastapi import APIRouter, Query,HTTPException, status, Depends, UploadFile, File
from DataBase.ConnectDB import db
from passlib.context import CryptContext
from DataBase.schemas.userSchema import admin_user_schema,global_user_schema
from utils.security import isEditorOrHigher,get_rol,isPublicadorOrHigher,get_token_id,isAdmin
from utils.infoVerify import valid_imagenes,valid_categoria,search_user,valid_contrasena
from utils.DbHelper import paginar,total_pages

router = APIRouter(prefix="/usuarios",tags=["Usuarios"])

crypt = CryptContext(schemes=["bcrypt"])

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
            "total_pages": total_pages(total,size),
            "usuarios": [admin_user_schema(row) for row in usuarios]
        }
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )

@router.get("/me",status_code=status.HTTP_200_OK)
async def get_me(user_id: int = Depends(get_token_id)):
    try:
        user_data = await search_user(user_id,1)
        
        if user_data is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail="Usuario inexistente")
        return global_user_schema(user_data)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error interno del servidor"
            )

@router.patch("/activo/{id}",status_code=status.HTTP_200_OK)
async def update_activo(id:int ,_:bool = Depends(isAdmin)):
    try:
        
        result = await db.fetch_val("UPDATE usuarios SET activo = NOT activo where id = :id RETURNING  id",{"id":id})

        if not result :
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail="Usuario inexistente")
        
        return {"detail": " Estado del usuario a sido actualizado correctamente"}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )
        
@router.patch("/pass",status_code = status.HTTP_200_OK)
async def update_password(password: str,new_password:str,user_id:str = Depends(get_token_id)):
    try:
        if not valid_contrasena(new_password):
            raise HTTPException(status_code=status.HTTP_406_NOT_ACCEPTABLE,
                                detail="Contraseña invalida,introduzca una contraseña que contenga 8 caracteres minimo y que incluya una letra mayuscula,una minuscula,un numero y un caracter especial(@$!%*?&),ejemplo: Hola123!")
        
        user = await search_user(user_id,1)
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail="Usuario inexistente")
            
        if not crypt.verify(password,user["contrasena"]):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                                detail="La contraseña actual no coincide")
            
        query = "UPDATE usuarios SET contrasena = :contrasena WHERE id=:id RETURNING id"
        
        result = await db.execute(query,{"contrasena":crypt.hash(new_password),"id":user_id})
        if not result:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se pudo actualizar la contraseña"
            )
            
        return {"detail": "Contraseña actualizada correctamente"}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error interno del servidor"
            )
        