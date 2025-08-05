from pydantic import BaseModel

class noticias(BaseModel):
    id: int | None
    contenido: str
    activo: bool 
    categoria_id: int
    usuario_id: int
    autor: str
    imagen: str