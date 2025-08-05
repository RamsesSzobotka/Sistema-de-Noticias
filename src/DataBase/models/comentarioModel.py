from pydantic import BaseModel

class comentarios(BaseModel):
    id : int | None
    noticia_id = int
    usuario_id = int
    contenido = str 
    comentario_padre_id = int