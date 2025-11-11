from fastapi import HTTPException, status
import uuid
import os
from core.ConnectDB import db
from dotenv import load_dotenv

load_dotenv()

UPLOAD_DIR = os.getenv("UPLOAD_DIR")


async def insert_img(imagenes, noticiaId: int):
    """
    Inserta y guarda físicamente las imágenes asociadas a una noticia.

    Parámetros:
        imagenes (list): Lista de archivos de imagen subidos (UploadFile).
        noticiaId (int): ID de la noticia a la cual se asociarán las imágenes.

    Descripción:
        - Crea el directorio de subida si no existe (definido por `UPLOAD_DIR`).
        - Genera un nombre de archivo único mediante `uuid4`.
        - Guarda físicamente cada imagen en el servidor.
        - Inserta el registro correspondiente en la tabla `imagenes`.

    Base de datos:
        Inserta en la tabla `imagenes` con las columnas:
            - noticia_id (INT)
            - imagen (TEXT)
            - tipo_imagen (VARCHAR)

    Lanza:
        HTTPException:
            - 400 BAD REQUEST: Si ocurre un error al guardar alguna imagen.
    """
    async with db.transaction():
        query_insert = """
        INSERT INTO imagenes(noticia_id, imagen, tipo_imagen)
        VALUES(:noticia_id, :imagen, :tipo_imagen)
        RETURNING id
        """

        # Crear el directorio de subida si no existe
        os.makedirs(UPLOAD_DIR, exist_ok=True)

        for img in imagenes:
            # Generar un nombre único y seguro para el archivo
            original_name = os.path.basename(img.filename or f"unnamed_{noticiaId}.jpg")
            safe_filename = f"{uuid.uuid4().hex}_{original_name}"
            file_path = os.path.join(UPLOAD_DIR, safe_filename)

            # Guardar el archivo físico
            with open(file_path, "wb") as f:
                f.write(await img.read())

            # Normalizar la ruta (barras "/" y minúsculas)
            normalized_path = file_path.replace("\\", "/").lower()

            # Valores para insertar en la BD
            values = {
                "noticia_id": noticiaId,
                "imagen": normalized_path,
                "tipo_imagen": img.content_type
            }

            imagen_id = await db.fetch_val(query_insert, values)

            # Validar inserción exitosa
            if imagen_id is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Error al guardar imágenes de noticia"
                )