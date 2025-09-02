from fastapi import APIRouter,HTTPException,status,Depends
from DataBase.models.comentarioModel import Comentario
from DataBase.schemas.comentarioSchema import comentario_schema
from DataBase.ConnectDB import db
from utils.infoVerify import valid_user,valid_noticia,valid_comentario_padre
from utils.security import get_token_id
from utils.HttpError import error_interno

router = APIRouter(prefix="/comentarios",tags=["Comentarios"])

@router.get("/{noticia_id}",status_code=status.HTTP_200_OK)
async def get_comentarios(noticia_id:int):
    try:
        await valid_noticia(noticia_id)
        query = """
        SELECT c.id, 
            c.contenido, 
            c.fecha_creacion, 
            c.usuario_id, 
            c.comentario_padre_id, 
            u.usuario
        FROM comentarios c
        JOIN usuarios u ON c.usuario_id = u.id
        WHERE c.noticia_id = :noticia_id
        ORDER BY c.fecha_creacion ASC
        """

        comentarios = await db.fetch_all(query, {"noticia_id": noticia_id})

        return {"comentarios": [comentario_schema(row) for row in comentarios]}
    except HTTPException:
        raise
    except Exception:
        raise error_interno()

@router.post("/",status_code=status.HTTP_201_CREATED)
async def post_comentario(comentario:Comentario,token_id:int = Depends(get_token_id)):
    try:
        await valid_noticia(comentario.noticia_id)
        await valid_user(token_id,1)
        await valid_comentario_padre(comentario.comentario_padre_id)
        
        if not comentario.contenido or not comentario.contenido.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El comentario no puede estar vacío"
            )

        query = """
        INSERT INTO comentarios(noticia_id,usuario_id,contenido,comentario_padre_id)
        VALUES(:noticia_id,:usuario_id,:contenido,:comentario_padre_id) RETURNING id"""
        
        values ={
            "noticia_id":comentario.noticia_id,
            "usuario_id":token_id,
            "contenido":comentario.contenido,
            "comentario_padre_id":comentario.comentario_padre_id
        }
        
        result = await db.execute(query,values)
        
        if not result:
            raise error_interno()

        return {"detail":"Comentario publicado exitosamente",
                "comentario_id":result}
    except HTTPException:
        raise
    except Exception:
        raise error_interno()