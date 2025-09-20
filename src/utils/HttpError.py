from fastapi import HTTPException,status

def errorInterno(e):
    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=f"Error interno del servidor: {e}"
    )
