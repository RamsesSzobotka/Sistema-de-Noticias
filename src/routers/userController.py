from fastapi import APIRouter, Query,HTTPException, status, Depends, UploadFile, File
from DataBase.ConnectDB import db
from typing import List
from DataBase.schemas.userSchema import admin_user_schema,global_user_schema
from utils.security import isEditorOrHigher,get_rol,isPublicadorOrHigher,get_token_id,isAdmin
from utils.infoVerify import valid_imagenes,valid_categoria,search_user
from utils.DbHelper import paginar,total_pages

router = APIRouter(prefix="/usuarios",tags=["Usuarios"])


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