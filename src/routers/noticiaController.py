from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from DataBase.ConnectDB import db
import os
from typing import List
from DataBase.models.noticiasModel import Noticias
from DataBase.schemas.noticiasSchema import noticia_schema
from utils.security import isEditorOrHigher,get_token_id
from utils.infoVerify import valid_imagenes,valid_categoria,search_user

router = APIRouter(prefix="/noticia",tags=["Noticias"])

UPLOAD_DIR = "ImagenesDB"

@router.get("/", status_code=status.HTTP_200_OK)
async def get_noticias():
    try:
        query = """
        SELECT 
            n.id,
            n.titulo,
            n.contenido,
            n.activo,
            n.fecha_creacion,
            c.id AS categoria_id,
            c.nombre AS categoria_nombre,
            u.id AS usuario_id,
            u.usuario as usuario_nombre,
            n.autor
        FROM noticias n
        JOIN categorias c ON n.categoria_id = c.id
        JOIN usuarios u ON n.usuario_id = u.id
        """

        resultados = await db.fetch_all(query)

        if not resultados:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail="No hay noticias")

        return noticia_schema(resultados)
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail=f"Error interno de lservidor")

@router.post("/")
async def crear_noticia(noticia:Noticias = Depends(Noticias.from_form),imagenes: List[UploadFile] = File(...),token_id = Depends(get_token_id),_ = Depends(isEditorOrHigher)):
    try:
        valid_imagenes(imagenes)
        valid_categoria(noticia.categoria_id)
        result = await search_user(token_id,1)
       
        if result is None:
           raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                               detail="Usuario inexistente")
        query = """
        INSERT INTO noticias(titulo,contenido,activo,categoria_id,usuario_id,autor)
        VALUES (:titulo,:contenido,:activo,:categoria_id,:usuario_id,:autor)
        RETURNING id"""
        
        values = {
            "titulo":noticia.titulo,
            "contenido":noticia.contenido,
            "activo":False,
            "categoria_id":noticia.categoria_id,
            "usuario_id":token_id,
            "autor":noticia.autor
        }
        
        noticia_id = await db.fetch_val(query,values)
        if noticia_id is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail="Error al crear la noticia")
        
        os.makedirs(UPLOAD_DIR,exist_ok=True)
        
        query ="""
            INSERT INTO imagenes(noticia_id,imagen,tipo_imagen)
            VALUES(:noticia_id,:imagen,:tipo_imagen)
            RETURNING id"""
            
        for img in imagenes:
            safe_filename = img.filename or f"unnamed_{noticia_id}.jpg"
            file_path = os.path.join(UPLOAD_DIR, safe_filename)

            with open(file_path, "wb") as f:
                f.write(await img.read())
                
            values = {
                "noticia_id":noticia_id,
                "imagen":file_path,
                "tipo_imagen":img.content_type
            }
            imagen_id = await db.fetch_val(query,values)
            if imagen_id is None:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                    detail="Error al guardar imagenes de noticia")
                
        return {"detail":"Noticia creada exitosamente en estado de espera a se aprovada para su publicacion"}
    except HTTPException:
        raise
    except Exception as e: 
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail=f"Error interno del servidor {e}")