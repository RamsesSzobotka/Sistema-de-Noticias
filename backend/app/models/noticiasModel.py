from pydantic import BaseModel
from fastapi import Form
from typing import Optional

class Noticias(BaseModel):
    id: Optional[int] = None
    titulo: str
    contenido: str
    categoria_id: int
    autor: str

    @staticmethod
    def from_form(
        id: Optional[int] = Form(None),
        titulo: str = Form(...),
        contenido: str = Form(...),
        categoria_id: int = Form(...),
        autor: str = Form(...)
    ):
        return Noticias(
            id=id,
            titulo=titulo,
            contenido=contenido,
            categoria_id=categoria_id,
            autor=autor
        )
