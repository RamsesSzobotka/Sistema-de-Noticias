from fastapi import HTTPException,status

def error_interno():
    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Error interno del servidor"
    )
