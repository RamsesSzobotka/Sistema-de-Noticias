--
-- PostgreSQL database dump
--

\restrict MoFKV6BKygc5U03JLOvkUPHtJmAX0tQKAAu9VEGlhZco6p1H2hTlxixMBl6KJm8

-- Dumped from database version 18.0
-- Dumped by pg_dump version 18.0

-- Started on 2025-11-24 22:22:38

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 219 (class 1259 OID 24581)
-- Name: categorias; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categorias (
    id integer NOT NULL,
    nombre character varying(50)
);


ALTER TABLE public.categorias OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 24585)
-- Name: categorias_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categorias_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categorias_id_seq OWNER TO postgres;

--
-- TOC entry 4992 (class 0 OID 0)
-- Dependencies: 220
-- Name: categorias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categorias_id_seq OWNED BY public.categorias.id;


--
-- TOC entry 221 (class 1259 OID 24586)
-- Name: comentarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comentarios (
    id integer NOT NULL,
    noticia_id integer NOT NULL,
    usuario_id integer NOT NULL,
    contenido text NOT NULL,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    comentario_padre_id integer
);


ALTER TABLE public.comentarios OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 24596)
-- Name: comentarios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.comentarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comentarios_id_seq OWNER TO postgres;

--
-- TOC entry 4993 (class 0 OID 0)
-- Dependencies: 222
-- Name: comentarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.comentarios_id_seq OWNED BY public.comentarios.id;


--
-- TOC entry 223 (class 1259 OID 24597)
-- Name: imagenes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.imagenes (
    id integer NOT NULL,
    noticia_id integer,
    imagen character varying(255),
    tipo_imagen character varying(255)
);


ALTER TABLE public.imagenes OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 24603)
-- Name: imagenes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.imagenes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.imagenes_id_seq OWNER TO postgres;

--
-- TOC entry 4994 (class 0 OID 0)
-- Dependencies: 224
-- Name: imagenes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.imagenes_id_seq OWNED BY public.imagenes.id;


--
-- TOC entry 225 (class 1259 OID 24604)
-- Name: likes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.likes (
    id integer NOT NULL,
    usuario_id integer NOT NULL,
    noticia_id integer NOT NULL,
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.likes OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 24611)
-- Name: likes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.likes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.likes_id_seq OWNER TO postgres;

--
-- TOC entry 4995 (class 0 OID 0)
-- Dependencies: 226
-- Name: likes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.likes_id_seq OWNED BY public.likes.id;


--
-- TOC entry 227 (class 1259 OID 24612)
-- Name: noticias; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.noticias (
    id integer NOT NULL,
    titulo character varying(250),
    contenido text,
    activo boolean DEFAULT true,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    categoria_id integer,
    usuario_id integer,
    autor character varying(100)
);


ALTER TABLE public.noticias OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 24620)
-- Name: noticias_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.noticias_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.noticias_id_seq OWNER TO postgres;

--
-- TOC entry 4996 (class 0 OID 0)
-- Dependencies: 228
-- Name: noticias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.noticias_id_seq OWNED BY public.noticias.id;


--
-- TOC entry 229 (class 1259 OID 24621)
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    nombre character varying(25),
    apellido character varying(25),
    usuario character varying(50),
    contrasena character varying(255),
    rol character varying(25),
    activo boolean DEFAULT true,
    create_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 24628)
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuarios_id_seq OWNER TO postgres;

--
-- TOC entry 4997 (class 0 OID 0)
-- Dependencies: 230
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- TOC entry 231 (class 1259 OID 24629)
-- Name: visitas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.visitas (
    id integer NOT NULL,
    cantidad integer DEFAULT 0
);


ALTER TABLE public.visitas OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 24634)
-- Name: visitas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.visitas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.visitas_id_seq OWNER TO postgres;

--
-- TOC entry 4998 (class 0 OID 0)
-- Dependencies: 232
-- Name: visitas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.visitas_id_seq OWNED BY public.visitas.id;


--
-- TOC entry 4785 (class 2604 OID 24635)
-- Name: categorias id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias ALTER COLUMN id SET DEFAULT nextval('public.categorias_id_seq'::regclass);


--
-- TOC entry 4786 (class 2604 OID 24636)
-- Name: comentarios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comentarios ALTER COLUMN id SET DEFAULT nextval('public.comentarios_id_seq'::regclass);


--
-- TOC entry 4788 (class 2604 OID 24637)
-- Name: imagenes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.imagenes ALTER COLUMN id SET DEFAULT nextval('public.imagenes_id_seq'::regclass);


--
-- TOC entry 4789 (class 2604 OID 24638)
-- Name: likes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.likes ALTER COLUMN id SET DEFAULT nextval('public.likes_id_seq'::regclass);


--
-- TOC entry 4791 (class 2604 OID 24639)
-- Name: noticias id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.noticias ALTER COLUMN id SET DEFAULT nextval('public.noticias_id_seq'::regclass);


--
-- TOC entry 4794 (class 2604 OID 24640)
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- TOC entry 4798 (class 2604 OID 24641)
-- Name: visitas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visitas ALTER COLUMN id SET DEFAULT nextval('public.visitas_id_seq'::regclass);


--
-- TOC entry 4973 (class 0 OID 24581)
-- Dependencies: 219
-- Data for Name: categorias; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categorias (id, nombre) FROM stdin;
1	deporte
2	politica
3	tecnologia
4	entretenimiento
\.


--
-- TOC entry 4975 (class 0 OID 24586)
-- Dependencies: 221
-- Data for Name: comentarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comentarios (id, noticia_id, usuario_id, contenido, fecha_creacion, comentario_padre_id) FROM stdin;
\.


--
-- TOC entry 4977 (class 0 OID 24597)
-- Dependencies: 223
-- Data for Name: imagenes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.imagenes (id, noticia_id, imagen, tipo_imagen) FROM stdin;
1	1	static/imagenesdb/noticia_01_img_01.jpg	image/jpeg
2	1	static/imagenesdb/noticia_01_img_02.jpg	image/jpeg
3	2	static/imagenesdb/noticia_02_img_01.jpg	image/jpeg
4	2	static/imagenesdb/noticia_02_img_02.jpg	image/jpeg
5	3	static/imagenesdb/noticia_03_img_01.jpg	image/jpeg
6	3	static/imagenesdb/noticia_03_img_02.jpg	image/jpeg
7	4	static/imagenesdb/noticia_04_img_01.jpg	image/jpeg
8	4	static/imagenesdb/noticia_04_img_02.jpg	image/jpeg
9	5	static/imagenesdb/noticia_05_img_01.jpg	image/jpeg
10	5	static/imagenesdb/noticia_05_img_02.jpg	image/jpeg
11	6	static/imagenesdb/noticia_06_img_01.jpg	image/jpeg
12	6	static/imagenesdb/noticia_06_img_02.jpg	image/jpeg
13	7	static/imagenesdb/noticia_07_img_01.jpg	image/jpeg
14	7	static/imagenesdb/noticia_07_img_02.jpg	image/jpeg
15	8	static/imagenesdb/noticia_08_img_01.jpg	image/jpeg
16	8	static/imagenesdb/noticia_08_img_02.jpg	image/jpeg
17	9	static/imagenesdb/noticia_09_img_01.jpg	image/jpeg
18	9	static/imagenesdb/noticia_09_img_02.jpg	image/jpeg
19	10	static/imagenesdb/noticia_10_img_01.jpg	image/jpeg
20	10	static/imagenesdb/noticia_10_img_02.jpg	image/jpeg
\.


--
-- TOC entry 4979 (class 0 OID 24604)
-- Dependencies: 225
-- Data for Name: likes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.likes (id, usuario_id, noticia_id, fecha) FROM stdin;
\.


--
-- TOC entry 4981 (class 0 OID 24612)
-- Dependencies: 227
-- Data for Name: noticias; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.noticias (id, titulo, contenido, activo, fecha_creacion, categoria_id, usuario_id, autor) FROM stdin;
1	Latinoamérica se Prepara para una Copa del Mundo Histórica en 2026	Con la Copa del Mundo de la FIFA 2026 en el horizonte, varias selecciones latinoamericanas intensifican sus preparativos para el torneo que por primera vez se disputará en tres países: Estados Unidos, Canadá y México. Argentina, vigente campeona, busca defender el título obtenido en Qatar 2022 con Lionel Messi aún como estandarte, mientras que Brasil renueva su plantilla con jóvenes promesas como Vinícius Jr. y Endrick. Uruguay, Colombia y Ecuador también completan sus procesos de clasificación con partidos amistosos de alto nivel competitivo.\n\nEl formato expandido a 48 equipos ha generado opiniones divididas: mientras algunos celebran la mayor representación global, otros critican que la calidad del torneo podría verse afectada. La CONMEBOL ha anunciado que sus selecciones realizarán giras internacionales para enfrentar a equipos de Europa y Asia, buscando una preparación integral que incluya diferentes estilos de juego. Los aficionados latinoamericanos ya comienzan a planificar sus viajes, y se espera una asistencia masiva de seguidores de la región en las sedes norteamericanas.\n\nEl aspecto económico también es relevante: se estima que el torneo generará más de 5 mil millones de dólares en ingresos, con un impacto significativo en el turismo y la infraestructura de las ciudades anfitrionas. Los organizadores han prometido un torneo sostenible y accesible, aunque persisten dudas sobre los costos de entrada y hospedaje para el público general.	t	2026-06-01 10:00:00	1	22	Admin
2	Inteligencia Artificial General: El Nuevo Horizonte que Divide a los Expertos	El año 2026 será recordado como el punto de inflexión en la carrera hacia la Inteligencia Artificial General (AGI). Varios laboratorios de investigación, incluyendo OpenAI, DeepMind y Anthropic, han reportado avances significativos en modelos capaces de razonar, planificar y aprender de manera autónoma en múltiples dominios. Estos sistemas ya no se limitan a procesar lenguaje natural: pueden escribir código complejo, diseñar experimentos científicos y mantener conversaciones coherentes sobre temas abstractos durante horas.\n\nSin embargo, el camino hacia la AGI no está exento de controversia. Un grupo de más de 200 científicos y figuras tecnológicas ha firmado una carta abierta pidiendo una pausa en el entrenamiento de modelos con capacidades superiores a GPT-6, citando riesgos existenciales que van desde la desinformación masiva hasta la pérdida de control sobre sistemas autónomos. Por otro lado, defensores del desarrollo acelerado argumentan que la AGI podría resolver problemas fundamentales como el cambio climático, las enfermedades neurodegenerativas y la distribución desigual de recursos.\n\nLos gobiernos no se han quedado atrás: la Unión Europea ha actualizado su AI Act para incluir disposiciones específicas sobre sistemas de propósito general, mientras que Estados Unidos creó una agencia federal dedicada a la supervisión de inteligencia artificial avanzada. China, por su parte, continúa invirtiendo miles de millones en su propio ecosistema de IA, con el objetivo de alcanzar la paridad tecnológica antes de 2030. El consenso entre los expertos es claro: la AGI ya no es una cuestión de si, sino de cuándo, y las decisiones que tomemos hoy definirán el futuro de la humanidad.	t	2026-06-02 10:00:00	3	22	Admin
3	Reforma Integral del Sistema de Salud: Un Debate que Cruza Fronteras	Diversos gobiernos en América Latina han puesto sobre la mesa ambiciosos planes de reforma sanitaria, impulsados por las lecciones aprendidas durante la pandemia de COVID-19 y el envejecimiento acelerado de la población. Los proyectos buscan universalizar la cobertura, reducir los tiempos de espera en hospitales públicos y modernizar la infraestructura hospitalaria mediante inversiones público-privadas que superan los 15 mil millones de dólares en la región.\n\nChile y Colombia lideran el proceso con propuestas que incluyen la digitalización completa de expedientes médicos, la telemedicina como servicio permanente y la creación de centros de atención primaria en zonas rurales históricamente desatendidas. En México, el gobierno ha anunciado la fusión de varios sistemas de salud en un solo organismo nacional, buscando eliminar la fragmentación que durante décadas ha generado inequidades en el acceso a servicios médicos de calidad.\n\nEl financiamiento sigue siendo el punto más espinoso del debate. Mientras los ministerios de hacienda advierten sobre el impacto fiscal de estas reformas, las organizaciones civiles señalan que la salud es un derecho humano fundamental que no puede estar sujeto a restricciones presupuestarias. Organismos internacionales como la OPS y el Banco Mundial han ofrecido asistencia técnica y financiera condicionada a la implementación de indicadores de calidad y transparencia en el gasto público sanitario.	t	2026-06-03 10:00:00	2	22	Admin
4	La Guerra del Streaming: Nuevas Plataformas Transforman el Entretenimiento Global	La industria del streaming continúa su evolución frenética en 2026, con nuevas plataformas emergentes desafiando el dominio establecido de Netflix, Disney+ y HBO Max. El mercado global de video bajo demanda ha superado los 200 mil millones de dólares, y la competencia por el contenido original se ha intensificado hasta niveles sin precedentes. Los estudios invierten cifras récord en producciones locales para capturar audiencias regionales, reconociendo que el contenido hiperlocal es la clave para la retención de suscriptores.\n\nLa consolidación del sector también ha traído sorpresas: la fusión entre Paramount y Warner Bros. Discovery ha creado un gigante con más de 200 millones de suscriptores combinados, mientras que Apple TV+ y Amazon Prime Video continúan expandiendo su catálogo con producciones aclamadas por la crítica. El fenómeno de las guerras del streaming ha beneficiado enormemente a los creadores de contenido, que ahora tienen múltiples compradores para sus proyectos y mayor poder de negociación que nunca antes.\n\nSin embargo, el aumento en los precios de las suscripciones está generando una fatiga creciente entre los consumidores. Un estudio reciente reveló que el hogar promedio en Estados Unidos paga por 4.7 servicios de streaming, con un costo mensual superior a los 60 dólares. Esto ha impulsado el resurgimiento de los planes con publicidad y la creación de paquetes agrupados a menor costo. Los analistas predicen que el próximo gran movimiento será la consolidación en 3 o 4 grandes conglomerados que dominarán el mercado global del entretenimiento digital.	t	2026-06-04 10:00:00	4	22	Admin
5	Ciberseguridad Cuántica: La Carrera por Proteger los Datos del Futuro	El advenimiento de la computación cuántica plantea uno de los mayores desafíos en la historia de la ciberseguridad. Los ordenadores cuánticos, capaces de realizar cálculos millones de veces más rápido que los sistemas tradicionales, amenazan con romper los algoritmos de encriptación que protegen desde transacciones bancarias hasta comunicaciones gubernamentales. Se estima que para 2030 un ordenador cuántico suficientemente potente podría descifrar el cifrado RSA-2048 en cuestión de horas.\n\nEn respuesta, una coalición global de empresas tecnológicas, gobiernos y universidades ha lanzado la Iniciativa de Criptografía Post-Cuántica (PQC), cuyo objetivo es desarrollar y estandarizar nuevos algoritmos resistentes a ataques cuánticos. El Instituto Nacional de Estándares y Tecnología (NIST) de Estados Unidos ya ha seleccionado cuatro algoritmos candidatos que serán la base de la próxima generación de seguridad digital. Empresas como Google, IBM y Microsoft han comenzado a implementar estos protocolos en sus productos y servicios de manera gradual.\n\nEl costo de la transición es astronómico: se estima que actualizar la infraestructura criptográfica global costará más de 300 mil millones de dólares en la próxima década. Los sectores más vulnerables incluyen la banca, la salud, la infraestructura crítica y los sistemas de defensa nacional. Los expertos advierten que los ataques harvest now, decrypt later —donde los atacantes recolectan datos cifrados hoy para descifrarlos cuando la tecnología cuántica esté disponible— ya están ocurriendo, lo que añade urgencia a la necesidad de migrar hacia sistemas criptográficos cuántico-resistentes lo antes posible.	t	2026-06-05 10:00:00	3	22	Admin
6	E-Sports Olímpicos: Los Videojuegos Competitivos Buscan su Lugar en los Juegos	El Comité Olímpico Internacional (COI) ha dado un paso histórico al anunciar la creación de los Juegos Olímpicos de E-Sports, un evento paralelo que se celebrará por primera vez en 2027 en Riad, Arabia Saudita. Esta decisión, largamente debatida dentro del movimiento olímpico, reconoce el crecimiento explosivo de los deportes electrónicos, que ya generan más de 2 mil millones de dólares anuales y cuentan con una audiencia global superior a los 600 millones de espectadores.\n\nLos títulos seleccionados para la edición inaugural incluyen League of Legends, Valorant, Street Fighter 6 y un simulador deportivo aún por confirmar. La decisión de incluir juegos de disparos ha generado controversia entre algunos comités nacionales, que cuestionan la compatibilidad de estos títulos con los valores olímpicos. El COI ha respondido estableciendo un riguroso código de conducta para jugadores y equipos, así como un sistema antidopaje adaptado a las particularidades de los deportes electrónicos.\n\nLos equipos latinoamericanos han recibido la noticia con entusiasmo, especialmente en Brasil, México, Argentina y Chile, países con comunidades de e-sports particularmente activas. La región ha producido talentos destacados en juegos como Free Fire, League of Legends y Rainbow Six Siege, y se espera que las inversiones en infraestructura de entrenamiento y academias juveniles se multipliquen en los próximos meses. Para muchos jóvenes latinoamericanos, los e-sports representan una vía de movilidad social y profesionalización en un campo que hasta hace poco era considerado solo un pasatiempo.	t	2026-06-06 10:00:00	1	22	Admin
7	Revolución en la Industria del Cine: La IA Generativa Transforma la Producción Audiovisual	La inteligencia artificial generativa está redefiniendo los límites de la producción cinematográfica. Estudios de Hollywood y productoras independientes por igual han comenzado a incorporar herramientas de IA en todas las etapas del proceso creativo, desde la escritura de guiones hasta la postproducción de efectos visuales. Películas enteras han sido creadas con la asistencia de modelos generativos, generando un debate profundo sobre la autoría, la originalidad y el futuro del empleo en la industria.\n\nLos sindicatos de actores y guionistas, que ya protagonizaron huelgas históricas en 2023 por este mismo tema, han negociado nuevos contratos que establecen límites claros al uso de IA en la producción. Entre las cláusulas acordadas se incluye la obligación de compensar a los creadores cuando sus obras sean utilizadas para entrenar modelos, la prohibición de generar interpretaciones digitales de actores sin su consentimiento explícito, y la transparencia obligatoria sobre el uso de contenido generado por IA en los créditos de las películas.\n\nA pesar de las controversias, el impacto creativo es innegable. Directores como James Cameron y Denis Villeneuve han experimentado con herramientas de IA para previsualizar escenas complejas y generar entornos digitales fotorrealistas. En el cine independiente, la IA ha democratizado el acceso a efectos visuales de alta calidad que antes estaban reservados a grandes producciones. El Festival de Cine de Cannes ha anunciado una nueva categoría dedicada exclusivamente a obras realizadas con inteligencia artificial, mientras que la Academia de Artes y Ciencias Cinematográficas estudia la creación de un premio especial para innovación tecnológica en el cine.	t	2026-06-07 10:00:00	4	22	Admin
8	Acuerdo Climático de Barcelona: Las Naciones se Comprometen a Reducir Emisiones en un 60% para 2035	La Cumbre Mundial del Clima celebrada en Barcelona ha concluido con la firma de un acuerdo histórico en el que 195 naciones se comprometen a reducir sus emisiones de gases de efecto invernadero en un 60% para el año 2035, con la meta intermedia de alcanzar el 40% antes de 2030. El pacto, denominado Acuerdo de Barcelona, supera ampliamente los compromisos del Acuerdo de París de 2015 e incluye mecanismos de verificación vinculantes con sanciones económicas para los países incumplidores.\n\nLos puntos más destacados del acuerdo incluyen la eliminación gradual de los subsidios a combustibles fósiles para 2030, la creación de un fondo global de 500 mil millones de dólares para financiar la transición energética en países en desarrollo, y el establecimiento de un mercado internacional de carbono unificado. China y Estados Unidos, los dos mayores emisores del mundo, jugaron un papel crucial en las negociaciones, comprometiéndose a duplicar sus inversiones en energías renovables durante los próximos cinco años.\n\nLas reacciones han sido mixtas. Organizaciones ambientales como Greenpeace y Fridays for Future han celebrado el acuerdo como un paso en la dirección correcta pero advierten que las metas podrían ser insuficientes si no se acompañan de cambios estructurales más profundos en los modelos de producción y consumo. Por otro lado, sectores industriales y energéticos han expresado su preocupación por el impacto económico de las medidas, especialmente en países dependientes de la exportación de combustibles fósiles. Los próximos meses serán críticos para la implementación del acuerdo, con la primera revisión programada para la Cumbre de Río de Janeiro en 2027.	t	2026-06-08 10:00:00	2	22	Admin
9	Misión Artemis IV: La Humanidad Regresa a la Luna para Quedarse	La NASA, en colaboración con la Agencia Espacial Europea (ESA), JAXA de Japón y la Agencia Espacial Canadiense, ha lanzado con éxito la misión Artemis IV, la más ambiciosa desde el programa Apolo. Por primera vez en la historia, una tripulación internacional de seis astronautas —incluyendo dos mujeres y un astronauta latinoamericano— establecerá una base permanente en el polo sur lunar, una región clave por sus reservas de hielo de agua que podrían ser utilizadas para producir combustible y oxígeno.\n\nEl módulo de aterrizaje, bautizado Pionero, transporta módulos habitables inflables, vehículos de exploración presurizados y equipos de perforación para extraer recursos del suelo lunar. La base, diseñada para operar de manera continua durante al menos dos años, servirá como laboratorio científico y plataforma de prueba para las tecnologías que eventualmente permitirán misiones tripuladas a Marte, programadas tentativamente para la década de 2030.\n\nEl sector privado también juega un papel fundamental en esta misión. SpaceX ha proporcionado el cohete Starship Super Heavy para el transporte de carga pesada, mientras que Blue Origin ha desarrollado los sistemas de soporte vital y generación de energía. El costo total del programa Artemis se estima en 93 mil millones de dólares hasta 2030, una inversión que sus defensores justifican por los avances tecnológicos y el impulso a la economía espacial, que según proyecciones podría alcanzar los 1.8 billones de dólares anuales para 2035.	t	2026-06-09 10:00:00	3	22	Admin
10	Música Latina: El Sonido que Domina las Listas Globales en 2026	La música latina continúa su imparable ascenso en la escena global, consolidándose como el género de mayor crecimiento en las principales plataformas de streaming. Según el informe anual de la Federación Internacional de la Industria Fonográfica (IFPI), los artistas latinos representan actualmente el 35% del consumo global de música, un incremento del 12% respecto al año anterior. Spotify, Apple Music y YouTube Music reportan que 7 de cada 10 de las listas de reproducción más populares incluyen al menos un tema en español o portugués.\n\nArtistas como Bad Bunny, Karol G, Peso Pluma y Shakira continúan dominando las listas, pero el fenómeno va más allá de los nombres establecidos. La democratización de las herramientas de producción musical y la distribución digital ha permitido que emergentes talentos de Colombia, Argentina, México y Puerto Rico lleguen a audiencias globales sin necesidad de grandes sellos discográficos. Los ritmos urbanos como el reggaetón y el trap latino han evolucionado incorporando elementos de música electrónica, folk andino, bossa nova y hasta influencias africanas, creando un crisol sonoro único que trasciende fronteras.\n\nLos premios Latin Grammy 2026 rompieron récords de audiencia, con más de 50 millones de espectadores en todo el mundo, y la ceremonia celebrada en Sevilla fue elogiada por su producción y la calidad de las presentaciones en vivo. La Academia Latina de la Grabación ha anunciado la creación de nuevas categorías para reconocer la fusión de géneros y la inteligencia artificial en la producción musical, reflejando la evolución constante de una industria que se reinventa año tras año. Los expertos coinciden en que el Latin Boom no es una moda pasajera, sino una transformación estructural del mercado musical global.	t	2026-06-10 10:00:00	4	22	Admin
\.


--
-- TOC entry 4983 (class 0 OID 24621)
-- Dependencies: 229
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuarios (id, nombre, apellido, usuario, contrasena, rol, activo, create_time, updated_at) FROM stdin;
22	Ramses	Szobotka	admin	$2b$12$BuPQe4ermmd2rLHHnprraej6FiHUXEdqh1yIkwN8pwbLc9dkJz1gi	admin	t	2025-10-22 09:58:39.615285	2025-10-22 09:58:39.615285
31	Test	test	test	$2b$12$0MEGRJNTohp0JXcE11d0/etjkjdi0QzSNW81d8Fnp82pn91d5Aq7K	global	t	2025-11-17 12:22:40.047887	2025-11-17 12:22:40.047887
32	el pepinillo	fenandez	el pepe	$2b$12$HIiw1oaqUoxjSjcNrdZTBeuFryrXTwCmlpxRN8ylEzPSwvKdQdgqK	global	t	2025-11-17 20:49:29.64404	2025-11-17 20:49:29.64404
33	el pepinillo	fenandez	pepito	$2b$12$Sl44eDAE4VVciRNLaEA2mOTv9HwlcRXJbw2PWY/IDzPp5hIZHWMta	global	t	2025-11-17 20:50:55.737472	2025-11-17 20:50:55.737472
34	Dame	Tu cosita	Sametucosita	$2b$12$iv0RfBorskV52r4AIjEJZume7vmm3Tg5FAlGomhILd5xeJ7lHYMS.	global	t	2025-11-21 20:30:46.994019	2025-11-21 20:30:46.994019
35	Negros	Negro	Pipiyoss	$2b$12$1NnodtyzghRbATtMHG9pR.nNMHo1Lun0EWhc2rL/CKpJrzdnHTO46	global	t	2025-11-21 20:32:14.799543	2025-11-21 20:32:14.799543
23	Ramses	Szobotka	VKR	$2b$12$vK78AB8yFOfneel6rxXLVePe0jxTxbY2rP6kCopJHdc3J3RO1yoHO	editor	t	2025-10-24 13:06:12.581073	2025-10-24 13:06:12.581073
36	testy1	test1	Test2	$2b$12$aLhPSVpeqLH6lh8FFOTv3OiVZcRzmjEi9w7.FD7uuHIwtEPc1zd36	global	t	2025-11-24 10:42:43.138719	2025-11-24 10:42:43.138719
37	a	a	admin1	$2b$12$zk4cDhRxcjFRaL0Uu/VVwuCz87ZyD/kj0sO81.nSFssdmvw6jg3cK	supervisor	t	2025-11-24 10:43:54.286393	2025-11-24 10:43:54.286393
24	hftry	gdrtyuoi	gflutiñuolik	$2b$12$JxufL5.li1bZ6ob9tkgUpuYcNg7B5xtUMTLwkOPxTM7kbh8UrDllu	global	t	2025-10-24 14:07:44.447466	2025-10-24 14:07:44.447466
26	Jhonatan	Manza	juan1	$2b$12$U0PU8u3EWCDj1f0SEJfm1eMtv.K3wD8nVU/PZioIy9s8MniD7yQYC	supervisor	t	2025-10-27 15:40:27.426762	2025-10-27 15:40:27.426762
27	Patata	rosas	Juan	$2b$12$3HBEqaGw71HSvHBw9LyGL.9YeBKTxWP2cuvg95Z6arD3/PxDsmN3y	editor	t	2025-10-27 15:41:52.391043	2025-10-27 15:41:52.391043
28	Jose	Hernandez	Josesito	$2b$12$Zf3tVM.MEBXhEhzS9lUmWeZCNU7AQq.d8exMC7CwW8hNE4Ph7FbAC	editor	t	2025-10-30 19:43:42.634627	2025-10-30 19:43:42.634627
25	Fernando	admin	juan	$2b$12$oTcykv9tN2OAo0LP23vvaOitSEHjsHGpeBsy8yytbLJW7/tio0dEm	editor	t	2025-10-24 15:34:00.699474	2025-10-24 15:34:00.699474
29	Ramses	Sz	rams	$2b$12$zTlEiWwZVgbNyHZsfDUwn.pp1VXFpTY7HkLb9Z81DflEi/K8EKz0u	global	t	2025-10-30 20:06:49.313593	2025-10-30 20:06:49.313593
30	Alejandra	Ali	Patata	$2b$12$uxuoMFejwOlCP7KOBvk0e.rnqTbFRhHh2UmOXtqGAaOgucoTC5wVa	supervisor	t	2025-11-14 20:28:10.894664	2025-11-14 20:28:10.894664
\.


--
-- TOC entry 4985 (class 0 OID 24629)
-- Dependencies: 231
-- Data for Name: visitas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.visitas (id, cantidad) FROM stdin;
1	619
\.


--
-- TOC entry 4999 (class 0 OID 0)
-- Dependencies: 220
-- Name: categorias_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categorias_id_seq', 1, true);


--
-- TOC entry 5000 (class 0 OID 0)
-- Dependencies: 222
-- Name: comentarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.comentarios_id_seq', 1, false);


--
-- TOC entry 5001 (class 0 OID 0)
-- Dependencies: 224
-- Name: imagenes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.imagenes_id_seq', 20, true);


--
-- TOC entry 5002 (class 0 OID 0)
-- Dependencies: 226
-- Name: likes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.likes_id_seq', 1, false);


--
-- TOC entry 5003 (class 0 OID 0)
-- Dependencies: 228
-- Name: noticias_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.noticias_id_seq', 10, true);


--
-- TOC entry 5004 (class 0 OID 0)
-- Dependencies: 230
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 37, true);


--
-- TOC entry 5005 (class 0 OID 0)
-- Dependencies: 232
-- Name: visitas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.visitas_id_seq', 1, true);


--
-- TOC entry 4801 (class 2606 OID 24643)
-- Name: categorias categorias_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT categorias_pkey PRIMARY KEY (id);


--
-- TOC entry 4803 (class 2606 OID 24645)
-- Name: comentarios comentarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comentarios
    ADD CONSTRAINT comentarios_pkey PRIMARY KEY (id);


--
-- TOC entry 4805 (class 2606 OID 24647)
-- Name: imagenes imagenes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.imagenes
    ADD CONSTRAINT imagenes_pkey PRIMARY KEY (id);


--
-- TOC entry 4807 (class 2606 OID 24649)
-- Name: likes likes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_pkey PRIMARY KEY (id);


--
-- TOC entry 4809 (class 2606 OID 24651)
-- Name: likes likes_usuario_id_noticia_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_usuario_id_noticia_id_key UNIQUE (usuario_id, noticia_id);


--
-- TOC entry 4811 (class 2606 OID 24653)
-- Name: noticias noticias_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.noticias
    ADD CONSTRAINT noticias_pkey PRIMARY KEY (id);


--
-- TOC entry 4813 (class 2606 OID 24655)
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- TOC entry 4815 (class 2606 OID 24657)
-- Name: usuarios usuarios_usuario_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_usuario_key UNIQUE (usuario);


--
-- TOC entry 4817 (class 2606 OID 24659)
-- Name: visitas visitas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visitas
    ADD CONSTRAINT visitas_pkey PRIMARY KEY (id);


--
-- TOC entry 4818 (class 2606 OID 24660)
-- Name: comentarios comentarios_comentario_padre_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comentarios
    ADD CONSTRAINT comentarios_comentario_padre_id_fkey FOREIGN KEY (comentario_padre_id) REFERENCES public.comentarios(id) ON DELETE CASCADE;


--
-- TOC entry 4819 (class 2606 OID 24665)
-- Name: comentarios comentarios_noticia_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comentarios
    ADD CONSTRAINT comentarios_noticia_id_fkey FOREIGN KEY (noticia_id) REFERENCES public.noticias(id) ON DELETE CASCADE;


--
-- TOC entry 4820 (class 2606 OID 24670)
-- Name: comentarios comentarios_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comentarios
    ADD CONSTRAINT comentarios_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- TOC entry 4821 (class 2606 OID 24675)
-- Name: imagenes imagenes_noticia_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.imagenes
    ADD CONSTRAINT imagenes_noticia_id_fkey FOREIGN KEY (noticia_id) REFERENCES public.noticias(id) ON DELETE SET NULL;


--
-- TOC entry 4822 (class 2606 OID 24680)
-- Name: likes likes_noticia_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_noticia_id_fkey FOREIGN KEY (noticia_id) REFERENCES public.noticias(id) ON DELETE CASCADE;


--
-- TOC entry 4823 (class 2606 OID 24685)
-- Name: likes likes_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- TOC entry 4824 (class 2606 OID 24690)
-- Name: noticias noticias_categoria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.noticias
    ADD CONSTRAINT noticias_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categorias(id) ON DELETE SET NULL;


--
-- TOC entry 4825 (class 2606 OID 24695)
-- Name: noticias noticias_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.noticias
    ADD CONSTRAINT noticias_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE SET NULL;


-- Completed on 2025-11-24 22:22:38

--
-- PostgreSQL database dump complete
--

\unrestrict MoFKV6BKygc5U03JLOvkUPHtJmAX0tQKAAu9VEGlhZco6p1H2hTlxixMBl6KJm8

