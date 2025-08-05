from pydantic import BaseModel

class usuarios(BaseModel):
    id: int | None
    nombre: str
    apellido: str
    usuario: str
    contrasena: str
    rol: str
    activo: bool
    imagen: str
    