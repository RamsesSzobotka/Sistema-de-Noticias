def paginar(page:int,size:int): 
    return  (page - 1) * size

def total_pages(total:int,size:int):
    return (total + size - 1) // size