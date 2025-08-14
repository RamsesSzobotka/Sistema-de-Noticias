from fastapi import FastAPI
from routers import authController,noticiaController,visitasController
from fastapi.middleware.cors import CORSMiddleware
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
app.include_router(noticiaController.router)
app.include_router(visitasController.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tu frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Es la ruta raíz"}
