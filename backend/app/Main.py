from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from routers import authRouter,noticiaRouter,userRouter,likeRouter, comentarioRouter, visitasRouter
from core.ConnectDB import connect, disconnect
from contextlib import asynccontextmanager
from pathlib import Path
import asyncio

BASE_DIR = Path(__file__).resolve().parents[2]  
FRONTEND_DIR = BASE_DIR / "frontend"

CONFIG_DIR = FRONTEND_DIR / "config"
ASSETS_DIR = FRONTEND_DIR / "assets"
VIEWS_DIR = FRONTEND_DIR / "Views"

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect()
    yield
    # aplicar timeout al disconnect para evitar bloqueos largos
    try:
        await asyncio.wait_for(disconnect(), timeout=30)
    except asyncio.TimeoutError:
        pass

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

# Assets del frontend
app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")

# Config.js (importable desde /config/config.js)
app.mount("/config", StaticFiles(directory=CONFIG_DIR), name="config")

# Vistas del frontend (sirve index.html automáticamente)
app.mount("/", StaticFiles(directory=VIEWS_DIR, html=True), name="app")

#   Ruta raíz

@app.get("/api")
async def root():
    return {"message": "Bienvenido a NoticiaPTY"}