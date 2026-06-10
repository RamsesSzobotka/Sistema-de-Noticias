from typing import Optional
from pydantic import BaseModel, Field

class Usuarios(BaseModel):
    id: Optional[int] = None
    nombre: str = Field(min_length=1, max_length=25)
    apellido: str = Field(min_length=1, max_length=25)
    usuario: str = Field(min_length=3, max_length=50)
    contrasena: Optional[str] = None


class Usuarios_admin(Usuarios):
    rol : str