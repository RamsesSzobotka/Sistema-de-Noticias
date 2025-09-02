from fastapi import APIRouter,HTTPException,status,Depends
from DataBase.ConnectDB import db
from utils.infoVerify import valid_noticia
from utils.security import get_token_id
from utils.HttpError import error_interno
router = APIRouter(prefix="/like",tags=["Likes"])

@router.get("/{noticia_id}",status_code=status.HTTP_200_OK)
async def get_likes(noticia_id:int):
    try:
        await valid_noticia(noticia_id)
            
        query = "SELECT COUNT(*) AS total_likes FROM likes WHERE noticia_id = :noticia_id"
        
        total_likes = await db.fetch_val(query,{"noticia_id":noticia_id})

        return {"total_likes":total_likes or 0}
    except HTTPException:
        raise
    except Exception:
        error_interno()

@router.get("/me", status_code=status.HTTP_200_OK)
async def like_verify(noticia_id: int, token_id: int = Depends(get_token_id)):
    try:
        query = "SELECT id FROM likes WHERE usuario_id = :usuario_id AND noticia_id = :noticia_id"
        result = await db.fetch_one(query, {"usuario_id": token_id, "noticia_id": noticia_id})
        
        return {"liked": result is not None}
        
    except Exception:
        raise error_interno()

    
@router.post("/",status_code=status.HTTP_201_CREATED)
async def post_like(noticia_id:int,token_id: int = Depends(get_token_id)):
    try:
        await valid_noticia(noticia_id)
        query = "SELECT id FROM likes WHERE usuario_id =:usuario_id and noticia_id =:noticia_id"
        
        values = {
            "usuario_id":token_id,
            "noticia_id":noticia_id
            }
        
        result = await db.fetch_val(query,values)
        if result:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                                detail="Ya le as dado like a esta noticia")
            
        query = "INSERT INTO likes(usuario_id,noticia_id) VALUES(:usuario_id,:noticia_id) RETURNING id"
        
        result = await db.execute(query,{"usuario_id":token_id,"noticia_id":noticia_id})
        if not result:
            error_interno()
        
        return {"detail": "Like agregado"}
    except HTTPException:
        raise
    except Exception:
        error_interno()

@router.delete("/", status_code=status.HTTP_200_OK)
async def delete_like(noticia_id:int, token_id: int = Depends(get_token_id)):
    try:
        await valid_noticia(noticia_id)
        values = {"usuario_id": token_id, "noticia_id": noticia_id}

        query = "DELETE FROM likes WHERE usuario_id = :usuario_id AND noticia_id = :noticia_id RETURNING id"
        result = await db.fetch_val(query, values)

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No le has dado like a esta noticia"
            )

        return {"detail": "Like eliminado"}
    except HTTPException:
        raise
    except Exception:
        raise error_interno()



