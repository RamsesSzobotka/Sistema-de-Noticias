from fastapi import APIRouter,HTTPException,status,Depends,Query
from DataBase.models.comentarioModel import Comentario
from DataBase.schemas.comentarioSchema import comentario_schema
from DataBase.ConnectDB import db
from utils.infoVerify import valid_user,valid_noticia,valid_comentario_padre
from utils.security import get_token_id,get_rol
from utils.HttpError import error_interno
from utils.DbHelper import paginar,total_pages

router = APIRouter(prefix="/comentarios",tags=["Comentarios"])

@router.get("/{noticia_id}",status_code=status.HTTP_200_OK)
async def get_comentarios(
    noticia_id:int,
    page: int = Query(1, ge=1,description="Número de página"),
    size: int = Query(10, ge=1, le=100),
):
    try:
   
        await valid_noticia(noticia_id)
        offset= paginar(page,size)
        
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
        LIMIT :size OFFSET :offset
        """
        values = {
            "noticia_id":noticia_id,
            "size":size,
            "offset":offset
        }
        
        comentarios = await db.fetch_all(query,values)
        total = await db.fetch_val(
        "SELECT COUNT(*) FROM comentarios WHERE noticia_id = :noticia_id",
        {"noticia_id": noticia_id})
        
        return {
            "page": page,
            "size": size,
            "total":total,
            "total_pages": total_pages(total, size),
            "usuarios": [comentario_schema(row) for row in comentarios]
        }
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
        
        result = await db.fetch_val(query,values)
        
        if not result:
            raise error_interno()

        return {"detail":"Comentario publicado exitosamente",
                "comentario_id":result}
    except HTTPException:
        raise
    except Exception:
        raise error_interno()

@router.delete("/", status_code=status.HTTP_200_OK)
async def delete_comentario(id: int, token_id: int = Depends(get_token_id)):
    try:
        # Validar usuario
        await valid_user(token_id, 1)

        # Verificar si el comentario existe
        query = "SELECT usuario_id FROM comentarios WHERE id = :id"
        comentario_usuario = await db.fetch_one(query, {"id": id})
        if comentario_usuario is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail="Comentario no encontrado")

        # Validar permisos
        if not (token_id == comentario_usuario["usuario_id"] or get_rol(token_id) == "admin"):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                                detail="No tienes acceso a esta acción")

        # Armar query para borrar comentario (y sus hijos si aplica)
        query = "DELETE FROM comentarios WHERE id = :id"
        if await valid_comentario_padre(id) is None:
            query += " OR comentario_padre_id = :id"

        # Usar RETURNING con fetch_one
        query += " RETURNING id"
        result = await db.fetch_one(query, {"id": id})

        if result is None:
            raise error_interno()

        return {"detail": f"Comentario {result['id']} eliminado correctamente"}

    except HTTPException:
        raise
    except Exception:
        raise error_interno()