from pydantic import BaseModel, Field
from fastapi import Form
from typing import Optional

class Noticias(BaseModel):
    id: Optional[int] = None
    titulo: str = Field(min_length=1, max_length=250)
    contenido: str = Field(min_length=1)
    categoria_id: int
    autor: str = Field(min_length=1, max_length=100)
    imagenes_eliminar: list[int] = []

    @staticmethod
    def from_form(
        id: Optional[int] = Form(None),
        titulo: str = Form(...),
        contenido: str = Form(...),
        categoria_id: int = Form(...),
        autor: str = Form(...),
        imagenes_eliminar: str = Form("")
    ):
        ids = []
        if imagenes_eliminar:
            ids = [int(x) for x in imagenes_eliminar.split(",") if x.strip()]
        return Noticias(
            id=id,
            titulo=titulo,
            contenido=contenido,
            categoria_id=categoria_id,
            autor=autor,
            imagenes_eliminar=ids
        )
