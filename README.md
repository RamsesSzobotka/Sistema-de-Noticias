# Sistema de Noticias — NoticiaPTY

Sistema completo de gestión y visualización de noticias con autenticación JWT (httpOnly cookies), comentarios anidados, likes, carga de imágenes, flujo de aprobación editor→supervisor y paneles administrativos por roles.

---

## Características principales

| Característica | Detalle |
|----------------|---------|
| **Autenticación** | JWT vía httpOnly cookies + bcrypt (protección XSS) |
| **Roles jerárquicos** | `global` → `editor` → `supervisor` → `admin` |
| **Flujo de noticias** | Editor crea (inactiva por defecto) → Supervisor/admin activa |
| **Comentarios anidados** | Respuestas en hilo (comentario_padre_id), paginados |
| **Likes** | Único por usuario+noticia, toggle on/off |
| **Contador de visitas** | UPDATE atómico SQL, tabla de una fila |
| **Carga de imágenes** | Múltiples imágenes por noticia, UUID, validación de formato |
| **Búsqueda** | LIKE sobre título, contenido y autor |
| **Paginación** | Todos los listados paginados (page + size) |
| **Diseño responsive** | Mobile-first con menú lateral tipo drawer |
| **Estados de carga** | Skeleton loading, spinners, estados de error con botón Reintentar |
| **Sistema de diseño** | ~50 propiedades CSS personalizadas (colores, tipografía, sombras) |

---

## Tecnologías

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Backend** | Python + FastAPI + Uvicorn | Python 3.12, FastAPI ~0.117, Uvicorn 0.37 |
| **Frontend** | HTML5 + CSS3 + JavaScript (Vanilla, ES Modules) | — |
| **Base de datos** | PostgreSQL | 16 (alpine en Docker) |
| **Autenticación** | JWT (httpOnly cookies) + bcrypt | PyJWT 2.10, passlib/bcrypt 4.0 |
| **ORM/BD** | databases (async) + asyncpg | databases 0.9, asyncpg 0.30 |
| **Validación** | Pydantic v2 | 2.11 |
| **Contenedores** | Docker + Docker Compose | Python 3.12-slim, Postgres 16-alpine |
| **CDN frontend** | SweetAlert2, Font Awesome 6, Google Fonts (Inter + Playfair Display) | — |

---

## Inicio rápido con Docker

### Requisitos

- Docker y Docker Compose

### Pasos

```bash
# 1. Clonar e ingresar
git clone <repo-url>
cd Sistema-de-Noticias

# 2. Configurar variables de entorno
cp .env.example .env
# Editar SECRET_KEY con un valor seguro (ej: openssl rand -hex 32)

# 3. Construir y levantar
docker-compose up --build
```

El servidor estará disponible en `http://localhost:8000`

Documentación interactiva de la API: `http://localhost:8000/docs`

### Credenciales por defecto

Luego de la primera ejecución, la migración crea automáticamente:

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| Admin | Admin123! | admin |

### Comandos útiles

```bash
# Iniciar en segundo plano
docker-compose up -d --build

# Ver logs
docker-compose logs -f

# Detener
docker-compose down

# Detener y eliminar volúmenes (borra BD e imágenes subidas)
docker-compose down -v

# Ejecutar migración manualmente dentro del contenedor
docker-compose exec backend python /app/migrate.py

# Acceder a la BD directamente
docker-compose exec db psql -U postgres -d noticiapty
```

---

## Inicio local (sin Docker)

### Requisitos

- Python 3.12+
- PostgreSQL 16+ instalado y corriendo

### Pasos

```bash
# 1. Clonar e ingresar
git clone <repo-url>
cd Sistema-de-Noticias/backend

# 2. Crear y activar entorno virtual
python -m venv venv

# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

# 3. Instalar dependencias
pip install -r req.txt

# 4. Crear base de datos en PostgreSQL
# psql -U postgres -c "CREATE DATABASE noticiapty;"

# 5. Configurar variables de entorno
# Copiar .env.example a backend/.env y editar
cp ../.env.example .env

# 6. Ejecutar migración (crea tablas, categorías, admin y datos de ejemplo)
python migrate.py

# 7. Iniciar servidor
cd app
uvicorn Main:app --reload
```

Servidor en `http://127.0.0.1:8000`

---

## Migración de base de datos

La migración se ejecuta **automáticamente** al iniciar con Docker (via `entrypoint.sh`), o manualmente con:

```bash
cd backend
python migrate.py
```

**Qué hace** (es **idempotente** — ejecutarlo múltiples veces no duplica datos):

1. Crea las **7 tablas** si no existen (`CREATE TABLE IF NOT EXISTS`)
2. Inserta las **4 categorías** por defecto: deporte, politica, tecnologia, entretenimiento
3. Crea el **usuario admin** inicial si no existe: `Admin` / `Admin123!`
4. Inserta **4 noticias de ejemplo** con imágenes (en Docker, desde semilla interna)

### Tablas de la base de datos

| Tabla | Propósito |
|-------|-----------|
| `categorias` | Categorías de noticias (4 por defecto) |
| `usuarios` | Usuarios con rol, estado activo, timestamps |
| `noticias` | Noticias con título, contenido, autor, estado activo |
| `imagenes` | Múltiples imágenes por noticia (UUID, tipo) |
| `comentarios` | Comentarios anidados (comentario_padre_id) |
| `likes` | Likes con unique constraint (usuario_id, noticia_id) |
| `visitas` | Contador de visitas (una fila, UPDATE atómico) |

---

## Estructura del proyecto

```
Sistema-de-Noticias/
├── Dockerfile                     # Imagen Python 3.12-slim + entrypoint
├── docker-compose.yml             # Servicios: backend + db (Postgres 16)
├── .env.example                   # Plantilla de variables de entorno
├── .dockerignore
│
├── backend/
│   ├── app/
│   │   ├── Main.py                # Punto de entrada FastAPI, montajes estáticos
│   │   ├── core/
│   │   │   ├── ConnectDB.py       # Conexión asíncrona a PostgreSQL
│   │   │   └── security.py        # JWT encode/decode, bcrypt, checkeos de rol
│   │   ├── controllers/           # Lógica de negocio (6 controladores)
│   │   │   ├── authController.py
│   │   │   ├── noticiasController.py
│   │   │   ├── comentarioController.py
│   │   │   ├── likeController.py
│   │   │   ├── userController.py
│   │   │   └── visitasController.py
│   │   ├── models/                # Pydantic models (user, noticia, comentario)
│   │   ├── routers/               # Definición de rutas (6 routers)
│   │   ├── schemas/               # Serialización a dict (noticia, user, comentario)
│   │   ├── utils/                 # Helpers (imágenes, paginación, validación, errores)
│   │   └── static/imagenesdb/     # Imágenes subidas (volumen Docker: uploads)
│   ├── migrate.py                 # Migración + seed data (idempotente)
│   ├── entrypoint.sh              # Entrypoint Docker (espera BD, migra, inicia)
│   ├── req.txt                    # Dependencias Python
│   ├── backupDBcomandos.sql       # DDL completo (7 tablas)
│   └── backupNoticia.sql          # Backup completo con datos
│
├── frontend/
│   ├── index.html                 # Redirecciona a Views/index.html
│   ├── config/config.js           # API_BASE_URL (vacío = mismo origen)
│   ├── assets/logo.png            # Logo / favicon
│   ├── js/auth.js                 # Módulo compartido auth (navbar, drawer, sesión)
│   └── css/                       # Sistema de diseño centralizado
│       ├── design-system.css      # Custom properties, skeleton, spinner, badges
│       ├── home.css               # Home page
│       ├── detail.css             # Detalle de noticia (comentarios, likes)
│       ├── auth.css               # Login / registro
│       ├── admin-common.css       # Estilos compartidos admin
│       ├── admin-news.css         # Panel de noticias admin
│       ├── admin-users.css        # Panel de usuarios admin
│       ├── form-news.css          # Formularios crear/editar noticia
│       └── profile.css            # Perfil de usuario
│   └── Views/                     # Páginas HTML + JS por vista
│       ├── index.html             # Home (navbar, hero, grillas, skeleton)
│       ├── index.js               # Lógica home (render, búsqueda, filtro, load more)
│       ├── auth/
│       │   ├── iniciar-sesion/    # Login
│       │   └── registro/          # Registro
│       ├── detalle-noticia/       # Detalle + comentarios anidados + likes
│       ├── crear-noticia/         # Crear noticia (formulario + imágenes)
│       ├── editar-noticia/        # Editar noticia
│       ├── administrar-noticia/   # Panel admin de noticias (aprobar/rechazar)
│       ├── administrar-usuario/   # Panel admin de usuarios (acordeón + modal)
│       └── editar-usuario/        # Perfil (avatar iniciales, cambio contraseña)
│
│
└── README.md
```

### Montajes estáticos (FastAPI)

FastAPI monta carpetas del frontend como archivos estáticos:

| Ruta URL | Carpeta física |
|----------|---------------|
| `/static` | `backend/app/static/` |
| `/assets` | `frontend/assets/` |
| `/config` | `frontend/config/` |
| `/js` | `frontend/js/` |
| `/css` | `frontend/css/` |
| `/` | `frontend/Views/` (SPA con `html=True`) |

---

## Roles y permisos

| Acción | global | editor | supervisor | admin |
|--------|--------|--------|------------|-------|
| Ver noticias | ✅ | ✅ | ✅ | ✅ |
| Comentar / likes | ✅ | ✅ | ✅ | ✅ |
| Editar perfil propio | ✅ | ✅ | ✅ | ✅ |
| Crear noticia | ❌ | ✅ | ✅ | ✅ |
| Editar noticia propia | ❌ | ✅ | ✅ | ✅ |
| Eliminar noticia propia | ❌ | ✅ | ✅ | ✅ |
| Aprobar/rechazar noticias | ❌ | ❌ | ✅ | ✅ |
| Gestionar usuarios | ❌ | ❌ | ❌ | ✅ |
| Eliminar cualquier noticia | ❌ | ❌ | ❌ | ✅ |

**Flujo de aprobación**: Un `editor` crea noticias (quedan **inactivas** por defecto). Un `supervisor` o `admin` debe activarlas mediante el panel de administración para que sean visibles al público.

---

## API endpoints

### Autenticación

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/auth/login` | No | Iniciar sesión (setea httpOnly cookie) |
| POST | `/auth/register` | No | Registro de usuario |
| POST | `/auth/admin/register` | admin | Registrar usuario con rol específico |
| POST | `/auth/logout` | Sí | Cerrar sesión (limpia cookie) |

### Noticias

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/noticia/` | No | Noticias activas (paginado + filtro categoría) |
| GET | `/noticia/all` | supervisor+ | Todas las noticias (activas + inactivas) |
| GET | `/noticia/buscar` | No | Buscar en noticias activas |
| GET | `/noticia/buscar/admin` | supervisor+ | Buscar en todas las noticias |
| GET | `/noticia/{id}` | No | Detalle de noticia |
| POST | `/noticia/` | editor+ | Crear noticia (con imágenes) |
| PUT | `/noticia/` | editor+ | Editar noticia |
| PATCH | `/noticia/activo/{id}` | supervisor+ | Activar/desactivar noticia |
| DELETE | `/noticia/` | supervisor+ | Eliminar noticia |

### Comentarios

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/comentarios/{noticiaId}` | No | Comentarios de una noticia (paginado) |
| POST | `/comentarios/` | Sí | Crear comentario (soporta respuestas anidadas) |
| DELETE | `/comentarios/` | Sí | Eliminar comentario propio |

### Likes

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/like/{noticiaId}` | No | Contar likes de una noticia |
| GET | `/like/me/{noticiaId}` | Sí | ¿El usuario actual dio like? |
| POST | `/like/` | Sí | Dar like |
| DELETE | `/like/` | Sí | Quitar like |

### Usuarios

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/usuarios/` | admin | Listar usuarios (paginado, filtro por rol/estado) |
| GET | `/usuarios/me` | Sí | Obtener perfil del usuario actual |
| GET | `/usuarios/buscar` | admin | Buscar usuarios |
| PUT | `/usuarios/me` | Sí | Actualizar perfil propio |
| PATCH | `/usuarios/me/pass` | Sí | Cambiar contraseña |
| PATCH | `/usuarios/{id}` | admin | Editar datos de un usuario (admin) |
| PATCH | `/usuarios/activo/{id}` | admin | Activar/desactivar usuario |
| PATCH | `/usuarios/update/rol` | admin | Cambiar rol de usuario |

### Visitas

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/vistas/` | No | Obtener contador de visitas |
| PUT | `/vistas/update` | No | Incrementar contador |

---

## Variables de entorno

| Variable | Por defecto | Descripción |
|----------|-------------|-------------|
| `DB_USER` | postgres | Usuario PostgreSQL |
| `DB_PASSWORD` | postgres | Contraseña PostgreSQL |
| `DB_HOST` | localhost | Host PostgreSQL (en Docker se auto-asigna `db`) |
| `DB_PORT` | 5432 | Puerto PostgreSQL |
| `DB_NAME` | noticiapty | Nombre de la base de datos |
| `SECRET_KEY` | — | Clave para firmar JWT (**requerido**, usar valor seguro) |
| `ACCESS_TOKEN_EXPIRED_MINUTES` | 60 | Expiración del token de acceso |
| `ALGORITHM` | HS256 | Algoritmo de firma JWT |
| `VALID_ROL` | admin,supervisor,editor,global | Roles válidos del sistema |
| `cors_origins` | * | Orígenes CORS permitidos |
| `UPLOAD_DIR` | static/imagenesdb | Directorio de imágenes subidas |

---

## Solución de problemas

**Las imágenes no cargan**: Verificar que `backend/app/static/imagenesdb/` existe y tiene permisos de escritura. En Docker, el volumen `uploads` lo persiste automáticamente.

**Error de conexión a BD**: En Docker, asegurar que el contenedor `db` esté corriendo (`docker-compose ps`). El entrypoint espera a que PostgreSQL esté listo via `pg_isready`. En local, verificar que PostgreSQL esté iniciado.

**Token inválido o expirado**: Iniciar sesión nuevamente. Los tokens usan httpOnly cookies con expiración configurable. Si ves "Sesión no válida" en el frontend pero el backend responde 200, probablemente la cookie no se está enviando correctamente (verificar `SameSite` y `domain`).

**Error `[object Object]` en categoría**: Ocurre si la categoría se renderiza como objeto. El backend siempre debe devolver `{id, nombre}` y el frontend acceder a `categoria.nombre`.