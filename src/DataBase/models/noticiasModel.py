from pydantic import BaseModel
from fastapi import Form

class Noticias(BaseModel):
    id: int | None
    titulo:str
    contenido: str
    categoria_id: int
    autor: str

    @staticmethod
    def from_form(
        id: int = Form(...),
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
