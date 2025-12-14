from core.ConnectDB import db
from utils.HttpError import errorInterno

async def getVisitasController():
    try:
        visitas = await obtainVisitas()
        return {"cantidad": visitas}
    except Exception:
        raise errorInterno()

async def updateVisitasController():
    try:
        async with db.transaction():
            visitas = await obtainVisitas()
            nueva_cantidad = visitas + 1
            query = "UPDATE visitas SET cantidad = :cantidad WHERE id = '1'"
            await db.execute(query, {"cantidad": nueva_cantidad})
    except Exception:
        raise errorInterno()

async def obtainVisitas():
    try:
        query = "SELECT cantidad FROM visitas"
        visitas = await db.fetch_one(query)
        if visitas is None:
            return 0
        return visitas["cantidad"]
    except Exception as e:
        raise errorInterno(e)
