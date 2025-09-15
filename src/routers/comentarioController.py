from fastapi import APIRouter,HTTPException,status,Depends,Query
from DataBase.models.comentarioModel import Comentario
from DataBase.schemas.comentarioSchema import comentario_schema
from DataBase.ConnectDB import db
from utils.infoVerify import validUser,validNoticia,validComentarioPadre
from utils.security import getTokenId,getRol
from utils.HttpError import errorInterno
from utils.DbHelper import paginar,totalPages

router = APIRouter(prefix="/comentarios",tags=["Comentarios"])

@router.get("/{noticia_id}",status_code=status.HTTP_200_OK)
async def getComentarios(
    noticia_id:int,
    page: int = Query(1, ge=1,description="Número de página"),
    size: int = Query(10, ge=1, le=100),
):
    try:
   
        await validNoticia(noticia_id)
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
            "total_pages": totalPages(total, size),
            "usuarios": [comentario_schema(row) for row in comentarios]
        }
    except HTTPException:
        raise
    except Exception:
        raise errorInterno()

@router.post("/",status_code=status.HTTP_201_CREATED)
async def post_comentario(comentario:Comentario,userId:int = Depends(getTokenId)):
    try:
        await validNoticia(comentario.noticia_id)
        await validUser(userId,1)
        await validComentarioPadre(comentario.comentario_padre_id)
        
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
            "usuario_id":userId,
            "contenido":comentario.contenido,
            "comentario_padre_id":comentario.comentario_padre_id
        }
        
        result = await db.fetch_val(query,values)
        
        if not result:
            raise errorInterno()

        return {"detail":"Comentario publicado exitosamente",
                "comentario_id":result}
    except HTTPException:
        raise
    except Exception:
        raise errorInterno()

@router.delete("/", status_code=status.HTTP_200_OK)
async def delete_comentario(id: int, userId: int = Depends(getTokenId)):
    try:
        # Validar usuario
        await validUser(userId, 1)

        # Verificar si el comentario existe
        query = "SELECT usuario_id FROM comentarios WHERE id = :id"
        comentario_usuario = await db.fetch_one(query, {"id": id})
        if comentario_usuario is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail="Comentario no encontrado")

        # Validar permisos
        if not (userId == comentario_usuario["usuario_id"] or getRol(userId) == "admin"):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                                detail="No tienes acceso a esta acción")

        # Armar query para borrar comentario (y sus hijos si aplica)
        query = "DELETE FROM comentarios WHERE id = :id"
        if await validComentarioPadre(id) is None:
            query += " OR comentario_padre_id = :id"

        # Usar RETURNING con fetch_one
        query += " RETURNING id"
        result = await db.fetch_one(query, {"id": id})

        if result is None:
            raise errorInterno()

        return {"detail": f"Comentario {result['id']} eliminado correctamente"}

    except HTTPException:
        raise
    except Exception:
        raise errorInterno()