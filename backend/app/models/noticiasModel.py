from pydantic import BaseModel, Field
from fastapi import Form
from typing import Optional

class Noticias(BaseModel):
    id: Optional[int] = None
    titulo: str = Field(min_length=1, max_length=250)
    contenido: str = Field(min_length=1)
    categoria_id: int
    autor: str = Field(min_length=1, max_length=100)

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
