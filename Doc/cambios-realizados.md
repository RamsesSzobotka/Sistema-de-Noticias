# Cambios Realizados

## Fecha: 8 de junio 2026

---

## 1. Dockerización del proyecto

Se contenerizó la aplicación en 2 servicios orquestados con Docker Compose.

### Archivos creados

| Archivo | Descripción |
|---------|-------------|
| `Dockerfile` | Imagen Python 3.12-slim. Instala dependencias, copia backend y frontend, configura entrypoint |
| `docker-compose.yml` | Servicio `db` (postgres:16-alpine, puerto 5432) y `backend` (build local, puerto 8000) |
| `.dockerignore` | Excluye `venv/`, `.git/`, `__pycache__/`, `.env` del build |
| `backend/entrypoint.sh` | Script de arranque: espera PostgreSQL via `pg_isready` → ejecuta migraciones → inicia uvicorn |
| `.env.example` | Template con todas las variables de entorno necesarias |

### Comandos

```bash
docker-compose up --build    # Construir y levantar
docker-compose up -d         # Segundo plano
docker-compose logs -f       # Ver logs
docker-compose down          # Detener
docker-compose down -v       # Detener y borrar volúmenes
```

---

## 2. Script de migración

### Archivo creado: `backend/migrate.py`

Script idempotente que se ejecuta automáticamente al iniciar el contenedor o manualmente:

```bash
cd backend && python migrate.py
```

**Qué hace**:
1. Crea las 6 tablas con `CREATE TABLE IF NOT EXISTS`:
   - `categorias`, `usuarios`, `noticias`, `imagenes`, `comentarios`, `likes`, `visitas`
2. Inserta las 4 categorías por defecto si la tabla está vacía: deporte, politica, tecnologia, entretenimiento
3. Crea el usuario admin inicial si no existe:
   - Usuario: **Admin**, Contraseña: **Admin123!**, Rol: **admin**

---

## 3. Arreglos críticos de seguridad

### 🔴 Auth bypass en comentarios

**Archivo**: `backend/app/controllers/comentarioController.py:102`

**Problema**: La validación de permisos para borrar comentarios tenía 2 bugs:
- Faltaba `await` en `getRol(userId)` → devolvía una corutina en vez del resultado
- `getRol` devuelve un dict `{"rol": "admin"}` pero se comparaba `dict != "admin"` que siempre es `True`

**Efecto**: Cualquier usuario autenticado podía borrar cualquier comentario, sin importar ownership ni rol de admin. El 403 nunca se lanzaba.

**Solución**:
```python
if not (userId == comentario_usuario["usuario_id"] or (await getRol(userId))["rol"] == "admin"):
```

### 🔴 Missing `raise` en 4 lugares

**Archivos**: `likeController.py:19,53,59`, `userController.py:207`

**Problema**: `errorInterno()` era llamado sin `raise`, por lo que la excepción se tragaba silenciosamente y el endpoint respondía 200 OK con cuerpo vacío.

**Solución**: Agregar `raise` antes de cada `errorInterno()`.

### 🔴 Race condition en visitas

**Archivo**: `backend/app/controllers/visitasController.py:14-17`

**Problema**: El contador de visitas usaba read-then-write (leer cantidad, incrementar en Python, escribir). Bajo concurrencia, dos requests podían leer el mismo valor y perderse un incremento.

**Solución**: Operación atómica:
```sql
UPDATE visitas SET cantidad = cantidad + 1 WHERE id = 1 RETURNING cantidad
```

### 🔴 `VALID_ROL` vacío creaba rol inválido

**Archivo**: `backend/app/utils/infoVerify.py:10`

**Problema**: `"".split(",")` produce `[""]`, un string vacío se convertía en rol válido permitiendo registros con rol `""`.

**Solución**:
```python
VALID_ROL = [r for r in os.getenv("VALID_ROL", "").strip().split(",") if r]
```

### 🔴 Cascading de comentarios hijos nunca se ejecutaba

**Archivo**: `backend/app/controllers/comentarioController.py:107-113`

**Problema**: La función `validComentarioPadre()` nunca retorna `None` para un ID existente — o retorna el registro o lanza HTTPException(404). La condición `is None` siempre era `False`, por lo que los comentarios hijo nunca se eliminaban en cascada y quedaban huérfanos en la DB.

**Solución**: Consultar directamente si existen hijos:
```python
hijos = await db.fetch_val("SELECT COUNT(*) FROM comentarios WHERE comentario_padre_id = :id", {"id": id})
if hijos > 0: query += " OR comentario_padre_id = :id"
```

---

## 4. Migración de autenticación: sessionStorage → Cookies httpOnly

### Motivación

- Las cookies httpOnly no son accesibles desde JavaScript, eliminando el riesgo de robo de tokens via XSS
- Las cookies persisten entre pestañas y sesiones del navegador
- Se elimina la complejidad del refresh token (sesión simple con cookie de 7 días)
- Las cookies se envían automáticamente en cada request, sin necesidad de headers manuales

### Cambios en backend

| Archivo | Cambio |
|---------|--------|
| `core/security.py` | `authToken` ahora lee de `request.cookies.get("access_token")` con fallback a `Authorization: Bearer` header. Se eliminaron `generateRefreshJWT()`, `refreshJWT()`, `hashPassword()` (dead code). Variable `REFRESH_TOKEN_EXPIRED_MINUTES` eliminada. |
| `controllers/authController.py` | `login()` acepta `response: Response` y setea cookie httpOnly `access_token` con 7 días de expiración. Retorna `{id, usuario, rol}` en vez de tokens. `registerController()` también setea cookie (auto-login). `newTokenController()` eliminado. |
| `routers/authRouter.py` | Endpoint `/refresh` eliminado. Endpoint `/logout` agregado (elimina cookie). `register` y `login` pasan `response` al controlador. |
| `.env.example` | Variable `REFRESH_TOKEN_EXPIRED_MINUTES` eliminada. |

### Cambios en frontend

| Archivo | Cambio |
|---------|--------|
| `Views/auth/auth.js` | **NUEVO**: Módulo compartido con `verificarSesion()`, `guardarSesion()`, `cerrarSesion()`, `mostrarBotonesPorRol()`, `usuarioId()`, `usuarioRol()`, `usuarioNombre()` |
| `Views/index.js` | Eliminado: `access_token` de sessionStorage, `Authorization` headers, funciones duplicadas `verificarSesion`, `mostrarBotonesPorRol`, `logout`. Ahora importa desde `auth.js`. |
| `Views/detalle-noticia/script.js` | Eliminado: tokens, Auth headers. Ahora usa `auth.js`. XSS corregido (comentarios con `createElement` + `textContent`). |
| `Views/crear-noticia/formulario-noticia.js` | Eliminado: token check, Auth headers. Verifica sesión via `/usuarios/me`. |
| `Views/editar-noticia/editar-noticia.js` | Eliminado: token, Auth headers. |
| `Views/administrar-noticia/panel_noticias.js` | Eliminado: tokens, Auth headers. XSS corregido (tabla con `createElement` + `textContent`). Debug logs eliminados. |
| `Views/administrar-usuario/panel_usuarios.js` | Eliminado: tokens, `replaceAll('"')`, Auth headers. XSS corregido. |
| `Views/editar-usuario/editar_usuario.js` | Eliminado: token, Auth headers. |
| `Views/auth/iniciar-sesion/script.js` | Eliminado: almacenamiento de tokens. Guarda sesión desde respuesta `{id, usuario, rol}`. |
| `Views/auth/registro/script.js` | Eliminado: redirección a login. Auto-login con cookie al registrarse. |
| `Views/index.html` | Viewport corregido a `width=device-width, initial-scale=1.0` para mobile. `onclick="logout()"` eliminado. |

---

## 5. README actualizado

**Archivo**: `README.md`

- Sección Docker con comandos de inicio
- Credenciales por defecto
- Sección de migración
- Estructura del proyecto actualizada
- Variables de entorno documentadas
- Endpoints actualizados
- Solución de problemas (Docker + local)
