from pydantic import BaseModel, Field
from typing import Optional

class Comentario(BaseModel):
    id: Optional[int] = None
    noticia_id : int
    contenido : str = Field(min_length=1)
    comentario_padre_id :Optional[int] | None