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

    # ──────────────────────────────────────────────
    # Noticias de ejemplo (solo si no hay ninguna)
    # ──────────────────────────────────────────────
    row = await conn.fetchrow("SELECT COUNT(*) as count FROM noticias")
    if row["count"] == 0:
        static_dir = "static/imagenesdb"
        news_data = [
            {
                "titulo": "La Selección se Prepara para el Mundial",
                "contenido": "El equipo nacional ha comenzado su preparación para la próxima copa del mundo con entrenamientos intensivos y partidos amistosos programados. Los jugadores muestran un gran compromiso y el cuerpo técnico confía en lograr una destacada participación en el torneo.",
                "categoria_id": 1,
                "imagenes": ["futbol1.webp", "futbol2.webp", "futbol3.webp"],
            },
            {
                "titulo": "Gobierno Anuncia Nuevas Reformas Económicas",
                "contenido": "El ejecutivo presentó hoy un paquete de reformas económicas que buscan impulsar el crecimiento y la estabilidad financiera del país. Las medidas incluyen incentivos fiscales para pequeñas empresas, inversión en infraestructura y programas de apoyo al empleo.",
                "categoria_id": 2,
                "imagenes": [
                    "cedc7d17f7164504abed2e85b7c3d7c0_c9a91e18b6844eeeb718898ff6ce02dc_gpzxhpox0aamk-j-1-768x432.jpg",
                    "c96cad9cdb744a56b9ceb6fea554fdc4_a7d9c9815fc041f2bc93b97fded596f7_ae797bd65a424b8f9235a08f60d9891f_wp4247207.jpg",
                    "4faf53aaaa484eb0ac1be5e30ff8d9d7_92875a3f81e0489d9c5ca34c5c4620ea_29250857d31d4fd78cac42e9df13283f_oip.jfif",
                ],
            },
            {
                "titulo": "Nueva Plataforma Tecnológica Revoluciona el Mercado",
                "contenido": "Una innovadora plataforma basada en inteligencia artificial promete transformar la manera en que las empresas gestionan sus datos. Con capacidades de análisis predictivo y automatización avanzada, esta tecnología ya está atrayendo la atención de los principales actores del sector.",
                "categoria_id": 3,
                "imagenes": [
                    "3c3c5401bc374259b241ec592d70ebd7_732e94f103ef4729b3667721f59b59fc_e33.webp",
                    "459f643937844a0d80a903c136fb1bc6_6902b13479e7484c8a229df643de6cb3_e855a5f385f94c6ca73170565bcfbdcc_silksong.jpg",
                    "ec36846e3f004cd8985e497ec1aa9f77_8f67c34b3d1145058601e0b072d1f228_6d5e92fdbdc0478fbbde0cb990bcf7e9_hqdefault.jpg",
                ],
            },
            {
                "titulo": "Festival de Cine Independiente Rompe Récords",
                "contenido": "La edición de este año del festival de cine independiente ha superado todas las expectativas con una asistencia récord de más de 50 mil personas. Películas de más de 30 países se exhibieron durante el evento, consolidándolo como uno de los más importantes del circuito cultural.",
                "categoria_id": 4,
                "imagenes": [
                    "08bf2cfa554240aa9421d2081b1d4edc_9b36afaeda6140d1b880894aab850fed_cf56957eee99481ca8765c1796af4477_images.jfif",
                    "0d30d6304d57440ba9bc1b2479132792_f43a3366155f45239da593e2fd524af5_oip.webp",
                    "default.png",
                ],
            },
        ]

        for news in news_data:
            noticia_id = await conn.fetchval(
                """INSERT INTO noticias (titulo, contenido, activo, categoria_id, usuario_id, autor)
                   VALUES ($1, $2, TRUE, $3, 1, 'Admin') RETURNING id""",
                news["titulo"], news["contenido"], news["categoria_id"],
            )
            for img_name in news["imagenes"]:
                ext = os.path.splitext(img_name)[1].lower()
                tipo = {
                    ".webp": "image/webp",
                    ".jpg": "image/jpeg",
                    ".jpeg": "image/jpeg",
                    ".jfif": "image/jpeg",
                    ".png": "image/png",
                }.get(ext, "image/jpeg")
                img_path = f"{static_dir}/{img_name}"
                await conn.execute(
                    "INSERT INTO imagenes (noticia_id, imagen, tipo_imagen) VALUES ($1, $2, $3)",
                    noticia_id, img_path, tipo,
                )
            print(f"  Noticia creada: {news['titulo'][:50]}...")

        # Inicializar contador de visitas si no existe
        v_row = await conn.fetchrow("SELECT COUNT(*) as count FROM visitas")
        if v_row["count"] == 0:
            await conn.execute("INSERT INTO visitas (cantidad) VALUES (0)")
        print("4 noticias de ejemplo creadas exitosamente.")

    await conn.close()


if __name__ == "__main__":
    asyncio.run(migrate())
