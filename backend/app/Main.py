from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from routers import authController,noticiaController,visitasController,userController,likeController,comentarioController
from fastapi.middleware.cors import CORSMiddleware
from core.ConnectDB import connect, disconnect
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect()
    yield
    await disconnect()

app = FastAPI(lifespan=lifespan)

# Registrar rutas
app.include_router(authController.router)
app.include_router(noticiaController.router)
app.include_router(visitasController.router)
app.include_router(userController.router)
app.include_router(likeController.router)
app.include_router(comentarioController.router)
app.mount("/imagenesdb", StaticFiles(directory="imagenesdb"), name="imagenesdb")

#cargar front
app.mount("/frontend", StaticFiles(directory="../../frontend/views"), name="frontend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Es la ruta raíz"}
