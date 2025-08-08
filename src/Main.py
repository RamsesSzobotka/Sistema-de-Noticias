from fastapi import FastAPI
from routers import authController
from DataBase.ConnectDB import connect, disconnect
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect()
    yield
    await disconnect()

app = FastAPI(lifespan=lifespan)

# Registrar rutas de login
app.include_router(authController.router)

@app.get("/")
async def root():
    return {"message": "Es la ruta raíz"}
