from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from routers import authRouter,noticiaRouter,userRouter,likeRouter, comentarioRouter, visitasRouter
from core.ConnectDB import connect, disconnect
from contextlib import asynccontextmanager
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[2]  
FRONTEND_DIR = BASE_DIR / "frontend"

CONFIG_DIR = FRONTEND_DIR / "config"
ASSETS_DIR = FRONTEND_DIR / "assets"
VIEWS_DIR = FRONTEND_DIR / "Views"

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect()
    yield
    await disconnect()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#   Routers
app.include_router(authRouter.router)
app.include_router(noticiaRouter.router)
app.include_router(visitasRouter.router)
app.include_router(userRouter.router)
app.include_router(likeRouter.router)
app.include_router(comentarioRouter.router)

#   Static files
# Imágenes de la BD
app.mount("/static", StaticFiles(directory="static"), name="imagenesdb")

#   Ruta raíz

@app.get("/api")
async def root():
    return {"message": "Bienvenido a NoticiaPTY"}