from fastapi import HTTPException,status
import uuid
import os
from core.ConnectDB import db
from utils.HttpError import errorInterno

load_dotenv()

UPLOAD_DIR = os.getenv("UPLOAD_DIR")

    
async def insert_img(imagenes, noticiaId: int):
    async with db.transaction():
        query_insert = """
        INSERT INTO imagenes(noticia_id, imagen, tipo_imagen)
        VALUES(:noticia_id, :imagen, :tipo_imagen)
        RETURNING id
        """
        os.makedirs(UPLOAD_DIR, exist_ok=True)

        for img in imagenes:
            original_name = os.path.basename(img.filename or f"unnamed_{noticiaId}.jpg")
            safe_filename = f"{uuid.uuid4().hex}_{original_name}"
            file_path = os.path.join(UPLOAD_DIR, safe_filename)

            # Guardar el archivo físico
            with open(file_path, "wb") as f:
                f.write(await img.read())

            # Normalizar la ruta (minúsculas + barras /)
            normalized_path = file_path.replace("\\", "/").lower()

            values = {
                "noticia_id": noticiaId,
                "imagen": normalized_path,
                "tipo_imagen": img.content_type
            }
            imagen_id = await db.fetch_val(query_insert, values)

            if imagen_id is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Error al guardar imágenes de noticia"
                )