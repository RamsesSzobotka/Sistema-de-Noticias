from fastapi import APIRouter,Query , status, Depends, UploadFile, File
import os
from typing import List, Optional
from controllers import noticiasController as Noticia
from models.noticiasModel import Noticias
from core.security import isEditorOrHigher, isPublicadorOrHigher, getTokenId
from dotenv import load_dotenv

router = APIRouter(prefix="/noticia", tags=["Noticias"])

load_dotenv()

UPLOAD_DIR = os.getenv("UPLOAD_DIR")

#obtener noticias activas
@router.get("/", status_code=status.HTTP_200_OK)
async def getNoticias(
    filtro: str = Query("todas",description="Filtros disponibles: 'deportes', 'politica', 'tecnologia', 'entretenimiento', 'activa' , 'inactiva'"),
    page: int = Query(1, ge=1, description="Número de página"),
    size: int = Query(5, ge=1, le=100, description="Cantidad de resultados por página"),
):
    return await Noticia.getNoticiasController(filtro,page,size)

#obtener todas las noticias (solo publicadores o administradores)
@router.get("/all", status_code=status.HTTP_200_OK)
async def getNoticiasAll(
    filtro: str = Query("todas",description="Filtros disponibles: 'activa', 'inactiva' "),
    page: int = Query(1, ge=1, description="Número de página"),
    size: int = Query(10, ge=1, le=100),
    _: bool = Depends(isPublicadorOrHigher)
):
    return await Noticia.getNoticiasAllController(page,size,filtro)

#buscar noticias activas
@router.get("/buscar", status_code=status.HTTP_200_OK)
async def buscarNoticias(
    query: str = Query(..., min_length=1, description="Texto a buscar en título, contenido o autor"),
    page: int = Query(1, ge=1, description="Número de página"),
    size: int = Query(10, ge=1, le=100, description="Cantidad de resultados por página"),
):
    return await Noticia.buscarNoticiasController(query,page,size)

#buscar cualquier noticia
@router.get("/buscar/admin", status_code=status.HTTP_200_OK)
async def buscarAdminNoticias(
    query: str = Query(..., min_length=1, description="Texto a buscar en título, contenido o autor"),
    page: int = Query(1, ge=1, description="Número de página"),
    size: int = Query(10, ge=1, le=100, description="Cantidad de resultados por página"),
    _: bool = Depends(isPublicadorOrHigher)
):
    return await Noticia.buscarNoticiasAdminController(query,page,size)

#obtener una noticia especifica
@router.get("/{id}", status_code=status.HTTP_200_OK)
async def getNoticia(id: int):
    return await Noticia.getNoticiaController(id)

#publicar una noticia
@router.post("/")
async def crearNoticia(
    noticia: Noticias = Depends(Noticias.from_form),
    imagenes: List[UploadFile] = File(...),
    userId: int = Depends(getTokenId),
    _: bool = Depends(isEditorOrHigher)
):
    return await Noticia.crearNoticiaController(noticia,imagenes,userId)

#actualizar una noticia
@router.put("/", status_code=status.HTTP_200_OK)
async def updateNoticia(
    noticia: Noticias = Depends(Noticias.from_form),
    imagenes: Optional[List[UploadFile]] = File(None),
    rol: str = Depends(isEditorOrHigher),
    tokenId: int = Depends(getTokenId)
):
  return await Noticia.updateNoticiaController(noticia,imagenes,rol,tokenId)  

#actualizar estado de una noticia(activa o inactiva)
@router.patch("/activo/{id}", status_code=status.HTTP_200_OK)
async def updateActivo(id: int, _: bool = Depends(isPublicadorOrHigher)):
    return await Noticia.updateActivoController(id)

#eliminar una noticia
@router.delete("/",status_code=status.HTTP_200_OK)
async def deleteNoticia(id: int, _:bool = Depends(isPublicadorOrHigher)):
    return await Noticia.deleteNoticiaController(id)