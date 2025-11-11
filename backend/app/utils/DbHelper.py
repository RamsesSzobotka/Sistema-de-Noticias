def paginar(page: int, size: int):
    """
    Pagina los datos de una consulta.

    Parámetros:
        page (int): Número de la página actual (comienza en 1).
        size (int): Tamaño de cada página (cantidad de elementos por página).

    Retorna:
        int: Índice inicial para la consulta paginada.
    """
    return (page - 1) * size


def totalPages(total: int, size: int):
    """
    Calcula el número total de páginas disponibles.

    Parámetros:
        total (int): Cantidad total de elementos.
        size (int): Tamaño de cada página.

    Retorna:
        int: Número total de páginas.
    """
    return (total + size - 1) // size
