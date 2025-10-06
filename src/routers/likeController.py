from fastapi import APIRouter,HTTPException,status,Depends
from DataBase.ConnectDB import db
from utils.infoVerify import validNoticia
from utils.security import getTokenId
from utils.HttpError import errorInterno
router = APIRouter(prefix="/like",tags=["Likes"])

@router.get("/{noticia_id}",status_code=status.HTTP_200_OK)
async def getLikes(noticiaId:int):
    try:
        await validNoticia(noticiaId)
            
        query = "SELECT COUNT(*) AS total_likes FROM likes WHERE noticia_id = :noticia_id"
        
        totalLikes = await db.fetch_val(query,{"noticia_id":noticiaId})

        return {"total_likes":totalLikes or 0}
    except HTTPException:
        raise
    except Exception:
        errorInterno()

@router.get("/me", status_code=status.HTTP_200_OK)
async def likeVerify(noticiaId: int, userId: int = Depends(getTokenId)):
    try:
        query = "SELECT id FROM likes WHERE usuario_id = :usuario_id AND noticia_id = :noticia_id"
        result = await db.fetch_one(query, {"usuario_id": userId, "noticia_id": noticiaId})
        
        return {"liked": result is not None}
        
    except Exception:
        raise errorInterno()

    
@router.post("/",status_code=status.HTTP_201_CREATED)
async def postLike(noticiaId:int,userId: int = Depends(getTokenId)):
    try:
        await validNoticia(noticiaId)
        async with db.transaction():
            query = "SELECT id FROM likes WHERE usuario_id =:usuario_id and noticia_id =:noticia_id"
            
            values = {
                "usuario_id":userId,
                "noticia_id":noticiaId
                }
            
            result = await db.fetch_val(query,values)
            if result:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                                    detail="Ya le as dado like a esta noticia")
                
            query = "INSERT INTO likes(usuario_id,noticia_id) VALUES(:usuario_id,:noticia_id) RETURNING id"
            
            result = await db.execute(query,{"usuario_id":userId,"noticia_id":noticiaId})
            if not result:
                errorInterno()
            
            return {"detail": "Like agregado"}
    except HTTPException:
        raise
    except Exception:
        errorInterno()

@router.delete("/", status_code=status.HTTP_200_OK)
async def deleteLike(noticiaId:int, userId: int = Depends(getTokenId)):
    try:
        await validNoticia(noticiaId)
        values = {"usuario_id": userId, "noticia_id": noticiaId}

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
        raise errorInterno()



