# Sistema de Noticias

Sistema completo de gestión y visualización de noticias con autenticación JWT, comentarios anidados, likes, carga de imágenes y paneles administrativos por roles.

---

## Tecnologías

**Backend**: Python 3.12 + FastAPI + Uvicorn  
**Frontend**: HTML5 + CSS3 + JavaScript (Vanilla)  
**Base de datos**: PostgreSQL 16  
**Autenticación**: JWT (access + refresh tokens) + bcrypt  
**Dependencias frontend**: SweetAlert2, Font Awesome (vía CDN)

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
# Editar SECRET_KEY con un valor seguro

# 3. Construir y levantar
docker-compose up --build
```

El servidor estará disponible en `http://localhost:8000`

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

# 6. Ejecutar migración (crea tablas, categorías y admin inicial)
python migrate.py

# 7. Iniciar servidor
cd app
uvicorn Main:app --reload
```

Servidor en `http://127.0.0.1:8000`  
Documentación interactiva: `http://127.0.0.1:8000/docs`

---

## Migración de base de datos

La migración se ejecuta automáticamente al iniciar con Docker, o manualmente con:

```bash
cd backend
python migrate.py
```

**Qué hace**:
1. Crea las 6 tablas si no existen (`CREATE TABLE IF NOT EXISTS`)
2. Inserta las 4 categorías por defecto: deporte, politica, tecnologia, entretenimiento
3. Crea el usuario admin inicial si no existe: `Admin` / `Admin123!`

Es **idempotente** — ejecutarlo múltiples veces no duplica datos.

---

## Estructura del proyecto

```
Sistema-de-Noticias/
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── .dockerignore
├── backend/
│   ├── app/
│   │   ├── Main.py                  # Punto de entrada FastAPI
│   │   ├── core/
│   │   │   ├── ConnectDB.py         # Conexión a PostgreSQL (async)
│   │   │   └── security.py          # JWT, hash, validación de roles
│   │   ├── controllers/
│   │   │   ├── authController.py
│   │   │   ├── noticiasController.py
│   │   │   ├── comentarioController.py
│   │   │   ├── likeController.py
│   │   │   ├── userController.py
│   │   │   └── visitasController.py
│   │   ├── models/                  # Pydantic models
│   │   ├── routers/                 # Definición de rutas
│   │   ├── schemas/                 # Serialización a dict
│   │   ├── utils/                   # Helpers (validación, imágenes, paginación)
│   │   └── static/imagenesdb/       # Imágenes subidas
│   ├── migrate.py                   # Script de migración
│   ├── entrypoint.sh                # Entrypoint para Docker
│   ├── req.txt                      # Dependencias Python
│   ├── backupDBcomandos.sql         # Schema DDL
│   └── backupNoticia.sql            # Backup completo con datos
├── frontend/
│   ├── config/config.js             # API_BASE_URL
│   ├── assets/                      # Logo y recursos
│   └── Views/                       # Páginas HTML + JS + CSS
│       ├── index.html               # Home
│       ├── auth/                    # Login / Registro
│       ├── detalle-noticia/         # Detalle + comentarios + likes
│       ├── crear-noticia/
│       ├── editar-noticia/
│       ├── administrar-noticia/
│       ├── administrar-usuario/
│       ├── editar-usuario/
│       └── css/                     # Estilos compartidos
└── README.md
```

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

---

## API endpoints

### Autenticación

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/auth/login` | No | Iniciar sesión |
| POST | `/auth/register` | No | Registro de usuario |
| POST | `/auth/admin/register` | admin | Registro con rol |
| POST | `/auth/refresh` | No | Refrescar token |

### Noticias

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/noticia/` | No | Noticias activas (paginado) |
| GET | `/noticia/all` | supervisor+ | Todas las noticias |
| GET | `/noticia/buscar` | No | Buscar en activas |
| GET | `/noticia/buscar/admin` | supervisor+ | Buscar en todas |
| GET | `/noticia/{id}` | No | Detalle de noticia |
| POST | `/noticia/` | editor+ | Crear noticia |
| PUT | `/noticia/` | editor+ | Editar noticia |
| PATCH | `/noticia/activo/{id}` | supervisor+ | Activar/desactivar |
| DELETE | `/noticia/` | supervisor+ | Eliminar noticia |

### Comentarios

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/comentarios/{noticiaId}` | No | Comentarios (paginado) |
| POST | `/comentarios/` | Sí | Crear comentario |
| DELETE | `/comentarios/` | Sí | Eliminar comentario propio |

### Likes

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/like/{noticiaId}` | No | Contar likes |
| GET | `/like/me/{noticiaId}` | Sí | ¿Usuario dio like? |
| POST | `/like/` | Sí | Dar like |
| DELETE | `/like/` | Sí | Quitar like |

### Usuarios

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/usuarios/` | admin | Listar usuarios |
| GET | `/usuarios/me` | Sí | Perfil actual |
| GET | `/usuarios/buscar` | admin | Buscar usuarios |
| PUT | `/usuarios/me` | Sí | Actualizar perfil |
| PATCH | `/usuarios/me/pass` | Sí | Cambiar contraseña |
| PATCH | `/usuarios/activo/{id}` | admin | Activar/desactivar |
| PATCH | `/usuarios/update/rol` | admin | Cambiar rol |

### Visitas

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/vistas/` | No | Obtener contador |
| PUT | `/vistas/update` | No | Incrementar contador |

---

## Variables de entorno

| Variable | Por defecto | Descripción |
|----------|-------------|-------------|
| `DB_USER` | postgres | Usuario PostgreSQL |
| `DB_PASSWORD` | postgres | Contraseña PostgreSQL |
| `DB_HOST` | localhost | Host PostgreSQL |
| `DB_PORT` | 5432 | Puerto PostgreSQL |
| `DB_NAME` | noticiapty | Nombre BD |
| `SECRET_KEY` | — | Clave para firmar JWT |
| `ACCESS_TOKEN_EXPIRED_MINUTES` | 60 | Expiración access token |
| `REFRESH_TOKEN_EXPIRED_MINUTES` | 1440 | Expiración refresh token |
| `ALGORITHM` | HS256 | Algoritmo JWT |
| `VALID_ROL` | admin,supervisor,editor,global | Roles válidos |
| `cors_origins` | * | Orígenes CORS permitidos |
| `UPLOAD_DIR` | static/imagenesdb | Directorio de imágenes |

---

## Solución de problemas

**Las imágenes no cargan**: Verificar que `backend/app/static/imagenesdb/` existe y tiene permisos de escritura. En Docker, el volumen `uploads` lo persiste automáticamente.

**Error de conexión a BD**: En Docker, asegurar que el contenedor `db` esté corriendo (`docker-compose ps`). En local, verificar que PostgreSQL esté iniciado.

**Token inválido o expirado**: Iniciar sesión nuevamente. Los tokens tienen expiración configurable via vars de entorno.
