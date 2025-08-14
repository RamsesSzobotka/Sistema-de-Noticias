
def noticia_schema(data)->dict:
    
    noticia = {
                "id": data["id"],
                "titulo": data["titulo"],
                "contenido": data["contenido"],
                "activo": data["activo"],
                "fecha_creacion": data["fecha_creacion"],
                "autor": data["autor"],
                "categoria": {
                    "id": data["categoria_id"],
                    "nombre": data["categoria_nombre"],
                },
                "usuario": {
                    "id": data["usuario_id"],
                    "usuario": data["usuario_nombre"],
                }
            }
    return noticia        