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
    # Noticias de ejemplo modernas (solo si no hay ninguna)
    # ──────────────────────────────────────────────
    row = await conn.fetchrow("SELECT COUNT(*) as count FROM noticias")
    if row["count"] == 0:
        static_dir = "static/imagenesdb"
        news_data = [
            {
                "titulo": "Latinoamérica se Prepara para una Copa del Mundo Histórica en 2026",
                "contenido": """Con la Copa del Mundo de la FIFA 2026 en el horizonte, varias selecciones latinoamericanas intensifican sus preparativos para el torneo que por primera vez se disputará en tres países: Estados Unidos, Canadá y México. Argentina, vigente campeona, busca defender el título obtenido en Qatar 2022 con Lionel Messi aún como estandarte, mientras que Brasil renueva su plantilla con jóvenes promesas como Vinícius Jr. y Endrick. Uruguay, Colombia y Ecuador también completan sus procesos de clasificación con partidos amistosos de alto nivel competitivo.

El formato expandido a 48 equipos ha generado opiniones divididas: mientras algunos celebran la mayor representación global, otros critican que la calidad del torneo podría verse afectada. La CONMEBOL ha anunciado que sus selecciones realizarán giras internacionales para enfrentar a equipos de Europa y Asia, buscando una preparación integral que incluya diferentes estilos de juego. Los aficionados latinoamericanos ya comienzan a planificar sus viajes, y se espera una asistencia masiva de seguidores de la región en las sedes norteamericanas.

El aspecto económico también es relevante: se estima que el torneo generará más de 5 mil millones de dólares en ingresos, con un impacto significativo en el turismo y la infraestructura de las ciudades anfitrionas. Los organizadores han prometido un torneo sostenible y accesible, aunque persisten dudas sobre los costos de entrada y hospedaje para el público general.""",
                "categoria_id": 1,
                "imagenes": ["noticia_01_img_01.jpg", "noticia_01_img_02.jpg"],
            },
            {
                "titulo": "Inteligencia Artificial General: El Nuevo Horizonte que Divide a los Expertos",
                "contenido": """El año 2026 será recordado como el punto de inflexión en la carrera hacia la Inteligencia Artificial General (AGI). Varios laboratorios de investigación, incluyendo OpenAI, DeepMind y Anthropic, han reportado avances significativos en modelos capaces de razonar, planificar y aprender de manera autónoma en múltiples dominios. Estos sistemas ya no se limitan a procesar lenguaje natural: pueden escribir código complejo, diseñar experimentos científicos y mantener conversaciones coherentes sobre temas abstractos durante horas.

Sin embargo, el camino hacia la AGI no está exento de controversia. Un grupo de más de 200 científicos y figuras tecnológicas ha firmado una carta abierta pidiendo una pausa en el entrenamiento de modelos con capacidades superiores a GPT-6, citando riesgos existenciales que van desde la desinformación masiva hasta la pérdida de control sobre sistemas autónomos. Por otro lado, defensores del desarrollo acelerado argumentan que la AGI podría resolver problemas fundamentales como el cambio climático, las enfermedades neurodegenerativas y la distribución desigual de recursos.

Los gobiernos no se han quedado atrás: la Unión Europea ha actualizado su AI Act para incluir disposiciones específicas sobre sistemas de propósito general, mientras que Estados Unidos creó una agencia federal dedicada a la supervisión de inteligencia artificial avanzada. China, por su parte, continúa invirtiendo miles de millones en su propio ecosistema de IA, con el objetivo de alcanzar la paridad tecnológica antes de 2030. El consenso entre los expertos es claro: la AGI ya no es una cuestión de 'si', sino de 'cuándo', y las decisiones que tomemos hoy definirán el futuro de la humanidad.""",
                "categoria_id": 3,
                "imagenes": ["noticia_02_img_01.jpg", "noticia_02_img_02.jpg"],
            },
            {
                "titulo": "Reforma Integral del Sistema de Salud: Un Debate que Cruza Fronteras",
                "contenido": """Diversos gobiernos en América Latina han puesto sobre la mesa ambiciosos planes de reforma sanitaria, impulsados por las lecciones aprendidas durante la pandemia de COVID-19 y el envejecimiento acelerado de la población. Los proyectos buscan universalizar la cobertura, reducir los tiempos de espera en hospitales públicos y modernizar la infraestructura hospitalaria mediante inversiones público-privadas que superan los 15 mil millones de dólares en la región.

Chile y Colombia lideran el proceso con propuestas que incluyen la digitalización completa de expedientes médicos, la telemedicina como servicio permanente y la creación de centros de atención primaria en zonas rurales históricamente desatendidas. En México, el gobierno ha anunciado la fusión de varios sistemas de salud en un solo organismo nacional, buscando eliminar la fragmentación que durante décadas ha generado inequidades en el acceso a servicios médicos de calidad.

El financiamiento sigue siendo el punto más espinoso del debate. Mientras los ministerios de hacienda advierten sobre el impacto fiscal de estas reformas, las organizaciones civiles señalan que la salud es un derecho humano fundamental que no puede estar sujeto a restricciones presupuestarias. Organismos internacionales como la OPS y el Banco Mundial han ofrecido asistencia técnica y financiera condicionada a la implementación de indicadores de calidad y transparencia en el gasto público sanitario.""",
                "categoria_id": 2,
                "imagenes": ["noticia_03_img_01.jpg", "noticia_03_img_02.jpg"],
            },
            {
                "titulo": "La Guerra del Streaming: Nuevas Plataformas Transforman el Entretenimiento Global",
                "contenido": """La industria del streaming continúa su evolución frenética en 2026, con nuevas plataformas emergentes desafiando el dominio establecido de Netflix, Disney+ y HBO Max. El mercado global de video bajo demanda ha superado los 200 mil millones de dólares, y la competencia por el contenido original se ha intensificado hasta niveles sin precedentes. Los estudios invierten cifras récord en producciones locales para capturar audiencias regionales, reconociendo que el contenido hiperlocal es la clave para la retención de suscriptores.

La consolidación del sector también ha traído sorpresas: la fusión entre Paramount y Warner Bros. Discovery ha creado un gigante con más de 200 millones de suscriptores combinados, mientras que Apple TV+ y Amazon Prime Video continúan expandiendo su catálogo con producciones aclamadas por la crítica. El fenómeno de las 'guerras del streaming' ha beneficiado enormemente a los creadores de contenido, que ahora tienen múltiples compradores para sus proyectos y mayor poder de negociación que nunca antes.

Sin embargo, el aumento en los precios de las suscripciones está generando una fatiga creciente entre los consumidores. Un estudio reciente reveló que el hogar promedio en Estados Unidos paga por 4.7 servicios de streaming, con un costo mensual superior a los 60 dólares. Esto ha impulsado el resurgimiento de los planes con publicidad y la creación de paquetes agrupados a menor costo. Los analistas predicen que el próximo gran movimiento será la consolidación en 3 o 4 grandes conglomerados que dominarán el mercado global del entretenimiento digital.""",
                "categoria_id": 4,
                "imagenes": ["noticia_04_img_01.jpg", "noticia_04_img_02.jpg"],
            },
            {
                "titulo": "Ciberseguridad Cuántica: La Carrera por Proteger los Datos del Futuro",
                "contenido": """El advenimiento de la computación cuántica plantea uno de los mayores desafíos en la historia de la ciberseguridad. Los ordenadores cuánticos, capaces de realizar cálculos millones de veces más rápido que los sistemas tradicionales, amenazan con romper los algoritmos de encriptación que protegen desde transacciones bancarias hasta comunicaciones gubernamentales. Se estima que para 2030 un ordenador cuántico suficientemente potente podría descifrar el cifrado RSA-2048 en cuestión de horas.

En respuesta, una coalición global de empresas tecnológicas, gobiernos y universidades ha lanzado la Iniciativa de Criptografía Post-Cuántica (PQC), cuyo objetivo es desarrollar y estandarizar nuevos algoritmos resistentes a ataques cuánticos. El Instituto Nacional de Estándares y Tecnología (NIST) de Estados Unidos ya ha seleccionado cuatro algoritmos candidatos que serán la base de la próxima generación de seguridad digital. Empresas como Google, IBM y Microsoft han comenzado a implementar estos protocolos en sus productos y servicios de manera gradual.

El costo de la transición es astronómico: se estima que actualizar la infraestructura criptográfica global costará más de 300 mil millones de dólares en la próxima década. Los sectores más vulnerables incluyen la banca, la salud, la infraestructura crítica y los sistemas de defensa nacional. Los expertos advierten que los ataques 'harvest now, decrypt later' —donde los atacantes recolectan datos cifrados hoy para descifrarlos cuando la tecnología cuántica esté disponible— ya están ocurriendo, lo que añade urgencia a la necesidad de migrar hacia sistemas criptográficos cuántico-resistentes lo antes posible.""",
                "categoria_id": 3,
                "imagenes": ["noticia_05_img_01.jpg", "noticia_05_img_02.jpg"],
            },
            {
                "titulo": "E-Sports Olímpicos: Los Videojuegos Competitivos Buscan su Lugar en los Juegos",
                "contenido": """El Comité Olímpico Internacional (COI) ha dado un paso histórico al anunciar la creación de los Juegos Olímpicos de E-Sports, un evento paralelo que se celebrará por primera vez en 2027 en Riad, Arabia Saudita. Esta decisión, largamente debatida dentro del movimiento olímpico, reconoce el crecimiento explosivo de los deportes electrónicos, que ya generan más de 2 mil millones de dólares anuales y cuentan con una audiencia global superior a los 600 millones de espectadores.

Los títulos seleccionados para la edición inaugural incluyen League of Legends, Valorant, Street Fighter 6 y un simulador deportivo aún por confirmar. La decisión de incluir juegos de disparos ha generado controversia entre algunos comités nacionales, que cuestionan la compatibilidad de estos títulos con los valores olímpicos. El COI ha respondido estableciendo un riguroso código de conducta para jugadores y equipos, así como un sistema antidopaje adaptado a las particularidades de los deportes electrónicos.

Los equipos latinoamericanos han recibido la noticia con entusiasmo, especialmente en Brasil, México, Argentina y Chile, países con comunidades de e-sports particularmente activas. La región ha producido talentos destacados en juegos como Free Fire, League of Legends y Rainbow Six Siege, y se espera que las inversiones en infraestructura de entrenamiento y academias juveniles se multipliquen en los próximos meses. Para muchos jóvenes latinoamericanos, los e-sports representan una vía de movilidad social y profesionalización en un campo que hasta hace poco era considerado solo un pasatiempo.""",
                "categoria_id": 1,
                "imagenes": ["noticia_06_img_01.jpg", "noticia_06_img_02.jpg"],
            },
            {
                "titulo": "Revolución en la Industria del Cine: La IA Generativa Transforma la Producción Audiovisual",
                "contenido": """La inteligencia artificial generativa está redefiniendo los límites de la producción cinematográfica. Estudios de Hollywood y productoras independientes por igual han comenzado a incorporar herramientas de IA en todas las etapas del proceso creativo, desde la escritura de guiones hasta la postproducción de efectos visuales. Películas enteras han sido creadas con la asistencia de modelos generativos, generando un debate profundo sobre la autoría, la originalidad y el futuro del empleo en la industria.

Los sindicatos de actores y guionistas, que ya protagonizaron huelgas históricas en 2023 por este mismo tema, han negociado nuevos contratos que establecen límites claros al uso de IA en la producción. Entre las cláusulas acordadas se incluye la obligación de compensar a los creadores cuando sus obras sean utilizadas para entrenar modelos, la prohibición de generar interpretaciones digitales de actores sin su consentimiento explícito, y la transparencia obligatoria sobre el uso de contenido generado por IA en los créditos de las películas.

A pesar de las controversias, el impacto creativo es innegable. Directores como James Cameron y Denis Villeneuve han experimentado con herramientas de IA para previsualizar escenas complejas y generar entornos digitales fotorrealistas. En el cine independiente, la IA ha democratizado el acceso a efectos visuales de alta calidad que antes estaban reservados a grandes producciones. El Festival de Cine de Cannes ha anunciado una nueva categoría dedicada exclusivamente a obras realizadas con inteligencia artificial, mientras que la Academia de Artes y Ciencias Cinematográficas estudia la creación de un premio especial para innovación tecnológica en el cine.""",
                "categoria_id": 4,
                "imagenes": ["noticia_07_img_01.jpg", "noticia_07_img_02.jpg"],
            },
            {
                "titulo": "Acuerdo Climático de Barcelona: Las Naciones se Comprometen a Reducir Emisiones en un 60% para 2035",
                "contenido": """La Cumbre Mundial del Clima celebrada en Barcelona ha concluido con la firma de un acuerdo histórico en el que 195 naciones se comprometen a reducir sus emisiones de gases de efecto invernadero en un 60% para el año 2035, con la meta intermedia de alcanzar el 40% antes de 2030. El pacto, denominado Acuerdo de Barcelona, supera ampliamente los compromisos del Acuerdo de París de 2015 e incluye mecanismos de verificación vinculantes con sanciones económicas para los países incumplidores.

Los puntos más destacados del acuerdo incluyen la eliminación gradual de los subsidios a combustibles fósiles para 2030, la creación de un fondo global de 500 mil millones de dólares para financiar la transición energética en países en desarrollo, y el establecimiento de un mercado internacional de carbono unificado. China y Estados Unidos, los dos mayores emisores del mundo, jugaron un papel crucial en las negociaciones, comprometiéndose a duplicar sus inversiones en energías renovables durante los próximos cinco años.

Las reacciones han sido mixtas. Organizaciones ambientales como Greenpeace y Fridays for Future han celebrado el acuerdo como "un paso en la dirección correcta" pero advierten que las metas podrían ser insuficientes si no se acompañan de cambios estructurales más profundos en los modelos de producción y consumo. Por otro lado, sectores industriales y energéticos han expresado su preocupación por el impacto económico de las medidas, especialmente en países dependientes de la exportación de combustibles fósiles. Los próximos meses serán críticos para la implementación del acuerdo, con la primera revisión programada para la Cumbre de Río de Janeiro en 2027.""",
                "categoria_id": 2,
                "imagenes": ["noticia_08_img_01.jpg", "noticia_08_img_02.jpg"],
            },
            {
                "titulo": "Misión Artemis IV: La Humanidad Regresa a la Luna para Quedarse",
                "contenido": """La NASA, en colaboración con la Agencia Espacial Europea (ESA), JAXA de Japón y la Agencia Espacial Canadiense, ha lanzado con éxito la misión Artemis IV, la más ambiciosa desde el programa Apolo. Por primera vez en la historia, una tripulación internacional de seis astronautas —incluyendo dos mujeres y un astronauta latinoamericano— establecerá una base permanente en el polo sur lunar, una región clave por sus reservas de hielo de agua que podrían ser utilizadas para producir combustible y oxígeno.

El módulo de aterrizaje, bautizado 'Pionero', transporta módulos habitables inflables, vehículos de exploración presurizados y equipos de perforación para extraer recursos del suelo lunar. La base, diseñada para operar de manera continua durante al menos dos años, servirá como laboratorio científico y plataforma de prueba para las tecnologías que eventualmente permitirán misiones tripuladas a Marte, programadas tentativamente para la década de 2030.

El sector privado también juega un papel fundamental en esta misión. SpaceX ha proporcionado el cohete Starship Super Heavy para el transporte de carga pesada, mientras que Blue Origin ha desarrollado los sistemas de soporte vital y generación de energía. El costo total del programa Artemis se estima en 93 mil millones de dólares hasta 2030, una inversión que sus defensores justifican por los avances tecnológicos y el impulso a la economía espacial, que según proyecciones podría alcanzar los 1.8 billones de dólares anuales para 2035.""",
                "categoria_id": 3,
                "imagenes": ["noticia_09_img_01.jpg", "noticia_09_img_02.jpg"],
            },
            {
                "titulo": "Música Latina: El Sonido que Domina las Listas Globales en 2026",
                "contenido": """La música latina continúa su imparable ascenso en la escena global, consolidándose como el género de mayor crecimiento en las principales plataformas de streaming. Según el informe anual de la Federación Internacional de la Industria Fonográfica (IFPI), los artistas latinos representan actualmente el 35% del consumo global de música, un incremento del 12% respecto al año anterior. Spotify, Apple Music y YouTube Music reportan que 7 de cada 10 de las listas de reproducción más populares incluyen al menos un tema en español o portugués.

Artistas como Bad Bunny, Karol G, Peso Pluma y Shakira continúan dominando las listas, pero el fenómeno va más allá de los nombres establecidos. La democratización de las herramientas de producción musical y la distribución digital ha permitido que emergentes talentos de Colombia, Argentina, México y Puerto Rico lleguen a audiencias globales sin necesidad de grandes sellos discográficos. Los ritmos urbanos como el reggaetón y el trap latino han evolucionado incorporando elementos de música electrónica, folk andino, bossa nova y hasta influencias africanas, creando un crisol sonoro único que trasciende fronteras.

Los premios Latin Grammy 2026 rompieron récords de audiencia, con más de 50 millones de espectadores en todo el mundo, y la ceremonia celebrada en Sevilla fue elogiada por su producción y la calidad de las presentaciones en vivo. La Academia Latina de la Grabación ha anunciado la creación de nuevas categorías para reconocer la fusión de géneros y la inteligencia artificial en la producción musical, reflejando la evolución constante de una industria que se reinventa año tras año. Los expertos coinciden en que el 'Latin Boom' no es una moda pasajera, sino una transformación estructural del mercado musical global.""",
                "categoria_id": 4,
                "imagenes": ["noticia_10_img_01.jpg", "noticia_10_img_02.jpg"],
            },
        ]

        for i, news in enumerate(news_data, start=1):
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
            print(f"  [{i}/10] Noticia creada: {news['titulo'][:60]}...")

        # Inicializar contador de visitas si no existe
        v_row = await conn.fetchrow("SELECT COUNT(*) as count FROM visitas")
        if v_row["count"] == 0:
            await conn.execute("INSERT INTO visitas (cantidad) VALUES (0)")
        print("10 noticias modernas creadas exitosamente.")

    await conn.close()


if __name__ == "__main__":
    asyncio.run(migrate())
