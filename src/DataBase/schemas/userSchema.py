def user_schema(data)->dict:
    
    usuario ={
        "id":data["id"],
        "nombre":data["nombre"],
        "apellido":data["apellido"],
        "usuario": data["usuario"],
        "contrasena": data["contrasena"],
        "rol" : data["rol"]
    }
    
    return usuario
