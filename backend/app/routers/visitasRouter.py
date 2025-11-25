from fastapi import APIRouter, status
from controllers.visitasController import getVisitasController, updateVisitasController

router = APIRouter(prefix="/vistas", tags=["Vistas"])


@router.get("/", status_code=status.HTTP_200_OK)
async def getVisitas():
    return await getVisitasController()

@router.put("/update", status_code=status.HTTP_200_OK)
async def updateVisitas():
    await updateVisitasController()