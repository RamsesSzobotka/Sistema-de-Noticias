from pydantic import BaseModel
from typing import Optional

class Comentario(BaseModel):
    id: Optional[int] = None
    noticia_id : int
    contenido : str 
    comentario_padre_id :Optional[int] | None