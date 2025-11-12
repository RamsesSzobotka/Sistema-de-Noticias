from json import load
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from routers import authController,noticiaController,visitasController,userController,likeController,comentarioController
from fastapi.middleware.cors import CORSMiddleware
from core.ConnectDB import connect, disconnect
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

load_dotenv()

CORS_ORIGINS = os.getenv("CORS_ORIGINS")

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect()
    yield
    await disconnect()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS, 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar rutas
app.include_router(authController.router)
app.include_router(noticiaController.router)
app.include_router(visitasController.router)
app.include_router(userController.router)
app.include_router(likeController.router)
app.include_router(comentarioController.router)
#Cargar imagenes
app.mount("/static", StaticFiles(directory="static"), name="imagenesdb")

app.mount("/",StaticFiles(directory="../../frontend/Views/",html=True), name="App")


@app.get("/")
async def root():
    return {"message": "Es la ruta raíz"}