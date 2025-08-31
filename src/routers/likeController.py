from fastapi import APIRouter,HTTPException,status,Depends
from DataBase.ConnectDB import db
from utils.infoVerify import search_noticia
from utils.security import get_token_id
router = APIRouter(prefix="/like",tags=["Likes"])

@router.get("/{id}",status_code=status.HTTP_200_OK)
async def get_likes(id:int):
    try:
        if await search_noticia(id) is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail="Noticia inexistente")
            
        query = "SELECT COUNT(*) AS total_likes FROM likes WHERE noticia_id = :noticia_id"
        
        total_likes = await db.fetch_val(query,{"noticia_id":id})

        return {"total_likes":total_likes or 0}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Error interno del servidor")


@router.post("/",status_code=status.HTTP_201_CREATED)
async def post_like(noticia_id:int,token_id: int = Depends(get_token_id)):
    try:
        if await search_noticia(noticia_id) is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail="Noticia inexistente")
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
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                                detail="Error interno del servidor")
        return {"detail": "Le diste like a esta noticia"}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                                detail="Error interno del servidor")