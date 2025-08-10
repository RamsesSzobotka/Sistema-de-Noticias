from typing import Optional
from pydantic import BaseModel

class Usuarios(BaseModel):
    id: Optional[int] = None
    nombre: str
    apellido: str
    usuario: str
    contrasena: str


class Usuarios_admin(Usuarios):
    rol : str
    activo: bool