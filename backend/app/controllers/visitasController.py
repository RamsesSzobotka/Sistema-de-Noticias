from core.ConnectDB import db
from utils.HttpError import errorInterno

async def getVisitasController():
    try:
        visitas = await obtainVisitas()
        return {"cantidad": visitas}
    except Exception as e:
        raise errorInterno(e)

async def updateVisitasController():
    try:
        async with db.transaction():
            query = "UPDATE visitas SET cantidad = cantidad + 1 WHERE id = 1 RETURNING cantidad"
            result = await db.fetch_val(query)
            if result is None:
                await db.execute("INSERT INTO visitas (cantidad) VALUES (1)")
    except Exception as e:
        raise errorInterno(e)

async def obtainVisitas():
    try:
        query = "SELECT cantidad FROM visitas"
        visitas = await db.fetch_one(query)
        if visitas is None:
            return 0
        return visitas["cantidad"]
    except Exception as e:
        raise errorInterno(e)
