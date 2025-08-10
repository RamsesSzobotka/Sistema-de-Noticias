from pydantic import BaseModel

class Usuarios(BaseModel):
    id: int | None
    nombre: str
    apellido: str
    usuario: str
    contrasena: str

class Usuarios_admin(Usuarios):
    rol : str
    activo: bool