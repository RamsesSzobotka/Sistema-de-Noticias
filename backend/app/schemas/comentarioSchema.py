def comentario_schema(data) -> dict:
    comentario = {
        "id": data["id"],
        "contenido": data["contenido"],
        "usuario": {
            "id": data["usuario_id"],
            "username": data["usuario"]
        },
        "fecha_creacion": data["fecha_creacion"],
        "comentario_padre": data["comentario_padre_id"] if data["comentario_padre_id"] else None
    }
    return comentario