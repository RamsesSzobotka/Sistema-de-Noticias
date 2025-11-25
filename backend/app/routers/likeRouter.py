from fastapi import APIRouter, status,Depends
from core.security import getTokenId
from controllers import likeController as Like
router = APIRouter(prefix="/like",tags=["Likes"])

@router.get("/{noticiaId}",status_code=status.HTTP_200_OK)
async def getLikes(noticiaId:int):
    return await Like.getLikesController(noticiaId)

@router.get("/me/{noticiaId}", status_code=status.HTTP_200_OK)
async def likeVerify(noticiaId: int, userId: int = Depends(getTokenId)):
    return await Like.likeVerifyController(noticiaId,userId)

@router.post("/",status_code=status.HTTP_201_CREATED)
async def postLike(noticiaId:int,userId: int = Depends(getTokenId)):
    return await Like.postLikeController(noticiaId,userId)

@router.delete("/", status_code=status.HTTP_200_OK)
async def deleteLike(noticiaId:int, userId: int = Depends(getTokenId)):
    return await Like.deleteLikeController(noticiaId,userId)