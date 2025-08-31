from fastapi import APIRouter, HTTPException, status
from DataBase.ConnectDB import db

router = APIRouter(prefix="/vistas", tags=["Vistas"])


@router.get("/", status_code=status.HTTP_200_OK)
async def get_visitas():
    try:
        visitas = await obtain_visitas()
        return {"cantidad": visitas}
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )


@router.put("/update", status_code=status.HTTP_200_OK)
async def update_visitas():
    try:
        visitas = await obtain_visitas()
        nueva_cantidad = visitas + 1
        query = "UPDATE visitas SET cantidad = :cantidad WHERE id = '1'"
        await db.execute(query, {"cantidad": nueva_cantidad})
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )


async def obtain_visitas():
    try:
        query = "SELECT cantidad FROM visitas"
        visitas = await db.fetch_one(query)
        if visitas is None:
            return 0
        return visitas["cantidad"]
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )
