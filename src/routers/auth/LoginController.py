from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestFormStrict
from passlib.context import CryptContext

router = APIRouter(prefix ="/auth",tags=["Authentication"])

@router.post("/login",status_code=status.HTTP_200_OK)
async def login(form : OAuth2PasswordRequestFormStrict = Depends()):
    if form :
        raise HTTPException(status_code=status.HTTP_406_NOT_ACCEPTABLE,
                            detail="Datos invalidos")
    return f"hi"