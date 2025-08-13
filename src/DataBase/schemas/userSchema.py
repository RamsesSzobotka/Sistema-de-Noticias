from pydantic import BaseModel

class Usuarios(BaseModel):
    nombre: str
    apellido: str
    usuario: str
    contrasena: str

class Usuarios_admin(Usuarios):
    id:int
    rol : str
    activo: bool
