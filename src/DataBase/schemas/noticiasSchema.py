from datetime import datetime
from pydantic import BaseModel

def noticia_schema(data)->list:
    
    noticias = []
    for row in data:
            noticia = {
                "id": row["id"],
                "titulo": row["titulo"],
                "contenido": row["contenido"],
                "activo": row["activo"],
                "fecha_creacion": row["fecha_creacion"],
                "autor": row["autor"],
                "categoria": {
                    "id": row["categoria_id"],
                    "nombre": row["categoria_nombre"],
                },
                "usuario": {
                    "id": row["usuario_id"],
                    "usuario": row["usuario_nombre"],
                }
            }
            noticias.append(noticia)
    return noticias