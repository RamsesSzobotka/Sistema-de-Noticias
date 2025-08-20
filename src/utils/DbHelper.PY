def paginar(page:int):
    size = 10  
    offset = (page - 1) * size
    return offset