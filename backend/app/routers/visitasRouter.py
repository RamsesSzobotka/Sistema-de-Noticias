from fastapi import APIRouter, status
from controllers.visitasController import getVisitasController, updateVisitasController

router = APIRouter(prefix="/vistas", tags=["Vistas"])

#obtener visitar a la pagina
@router.get("/", status_code=status.HTTP_200_OK)
async def getVisitas():
    return await getVisitasController()

#actualizar visitas a la pagina
@router.put("/update", status_code=status.HTTP_200_OK)
async def updateVisitas():
    await updateVisitasController()