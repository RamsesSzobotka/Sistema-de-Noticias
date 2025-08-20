def global_user_schema(data)->dict:
     
    usuario ={
        "id":data["id"],
        "nombre":data["nombre"],
        "apellido":data["apellido"],
        "usuario": data["usuario"]
    }
    
    return usuario

def admin_user_schema(data)->dict:
    
    usuario = global_user_schema(data)
    usuario["rol"] = data["rol"]
    usuario["activo"] = data["activo"]
    usuario["create_time"] = data["create_time"]
    usuario["updated_at"] = data["updated_at"]
    return usuario

