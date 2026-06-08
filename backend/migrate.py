import asyncio
import os
import sys

# Agregar app/ al path para que los módulos dentro de app/ puedan
# importarse entre sí (utils.xxx, core.xxx, etc.) sin prefijo "app."
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "app"))

from dotenv import load_dotenv
import asyncpg
from core.security import pwd_context

load_dotenv()

async def migrate() -> None:
    conn = await asyncpg.connect(
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "5432")),
        database=os.getenv("DB_NAME", "noticiapty"),
    )

    base = os.path.dirname(os.path.abspath(__file__))
    sql_path = os.path.join(base, "backupDBcomandos.sql")

    with open(sql_path, "r", encoding="utf-8") as f:
        sql = f.read()

    sql = sql.replace("CREATE TABLE", "CREATE TABLE IF NOT EXISTS")

    await conn.execute(sql)
    print("Migracion completada: tablas creadas exitosamente.")

    row = await conn.fetchrow("SELECT COUNT(*) as count FROM categorias")
    if row["count"] == 0:
        await conn.execute(
            "INSERT INTO categorias (nombre) VALUES ($1), ($2), ($3), ($4)",
            "deporte", "politica", "tecnologia", "entretenimiento",
        )
        print("Categorias por defecto insertadas.")

    usuario = await conn.fetchrow(
        "SELECT COUNT(*) as count FROM usuarios WHERE usuario = $1", "Admin"
    )
    if usuario["count"] == 0:
        await conn.execute(
            """INSERT INTO usuarios (nombre, apellido, usuario, contrasena, rol, activo)
               VALUES ($1, $2, $3, $4, $5, $6)""",
            "Admin",
            "Admin",
            "Admin",
            pwd_context.hash("Admin123!"),
            "admin",
            True,
        )
        print("Usuario admin creado: Admin / Admin123!")

    await conn.close()


if __name__ == "__main__":
    asyncio.run(migrate())
