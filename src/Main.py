from fastapi import FastAPI
from routers.auth import LoginController

app = FastAPI()
app.include_router(LoginController.router)

@app.get("/")
async def root ():
    return "message: es la ruta"