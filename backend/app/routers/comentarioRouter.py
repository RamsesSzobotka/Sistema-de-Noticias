from fastapi import APIRouter,status,Depends,Query
from models.comentarioModel import Comentario
from core.security import getTokenId
from controllers import comentarioController as Coment

router = APIRouter(prefix="/comentarios",tags=["Comentarios"])

@router.get("/{noticiaId}",status_code=status.HTTP_200_OK)
async def getComentarios(
    noticiaId:int,
    page: int = Query(1, ge=1,description="Número de página"),
    size: int = Query(10, ge=1, le=100),
):
   return await Coment.obtenerComentarios(noticiaId,page,size)

@router.post("/",status_code=status.HTTP_201_CREATED)
async def postComentario(comentario:Comentario,userId:int = Depends(getTokenId)):
    return await Coment.crearComentario(comentario,userId)

@router.delete("/", status_code=status.HTTP_200_OK)
async def deleteComentario(id: int, userId: int = Depends(getTokenId)):
    return await Coment.borrarComentario(id,userId)