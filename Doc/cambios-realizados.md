# Cambios Realizados

## Fecha: 8 de junio 2026

---

## 1. Mejoras UX/UI críticas (Responsive + Design System + Loading States)

### 1.1 Sistema de Diseño unificado

**Archivo creado**: `frontend/css/design-system.css`

Se creó un sistema de diseño completo con ~50 CSS custom properties:
- 22 colores, 15 tokens de tipografía, 6 espaciados, 5 radios de borde, 5 sombras, 3 transiciones
- Componentes reutilizables: `.skeleton` (loader), `.spinner`, `.hamburger` (menú mobile)
- 2 animaciones keyframes: `skeleton-pulse`, `spinner-rotate`

### 1.2 Diseño Responsive

Se hicieron responsivas TODAS las páginas con breakpoints mobile-first (480px, 768px, 1024px):

| Página | Cambio clave |
|--------|-------------|
| Home | Grid fixed `min-width:1200px` → `auto-fill, minmax(300px, 1fr)` |
| Detalle | Viewport `width=1200` (roto) → `width=device-width, initial-scale=1.0` |
| Admin usuarios | Tabla responsiva con `data-label` + `::before` card layout |
| Admin noticias | Vista responsiva corregida |
| Auth | Contenedor fluido, media query existente mejorada |
| Forms | Viewport meta agregado, contenedores con `max-width` + `width: 90%` |

### 1.3 Loading States

- **Home**: Skeletons CSS con 300ms debounce (evita flash en conexiones rápidas)
- **Detalle**: Spinner en carga de comentarios + empty state ("No hay comentarios aún")
- **Admin**: Spinner en fetch de tablas
- **Error state**: Mensaje con ícono + botón "Reintentar" en todas las vistas

### Archivos afectados (19: 1 nuevo, 18 modificados)

| Archivo | Cambio |
|---------|--------|
| `frontend/Views/css/design-system.css` | **NUEVO** — Sistema de diseño con variables + componentes |
| `frontend/Views/index.html` | Hamburguesa + nav-links wrapper |
| `frontend/Views/index.css` | Grid responsive, media queries, CSS vars |
| `frontend/Views/index.js` | Skeleton loading con debounce + error state + hamburguesa |
| `frontend/Views/detalle-noticia/index.html` | Viewport corregido |
| `frontend/Views/detalle-noticia/style.css` | Contenedor fluido, imágenes responsivas, CSS vars |
| `frontend/Views/detalle-noticia/script.js` | Spinner comentarios, empty state |
| `frontend/Views/administrar-usuario/panel_usuarios.js` | data-label + spinner |
| `frontend/Views/administrar-noticia/panel_noticias.js` | data-label + spinner |
| `frontend/Views/css/paneles-comunes.css` | Tablas responsivas card-layout |
| `frontend/Views/css/panel_aprobacion.css` | Tablas responsivas corregidas |
| `frontend/Views/css/auth.css` | CSS vars, contenedor responsivo |
| `frontend/Views/editar-usuario/index.html` | Contenedor fluido, inline styles migrados |
| `frontend/Views/administrar-noticia/index.html` | Viewport meta |
| `frontend/Views/administrar-usuario/index.html` | Viewport meta |
| `frontend/Views/crear-noticia/index.html` | Viewport meta |
| `frontend/Views/editar-noticia/index.html` | Viewport meta |
| `frontend/Views/auth/iniciar-sesion/index.html` | design-system.css |
| `frontend/Views/auth/registro/index.html` | design-system.css |

---

## 2. Rediseño completo del Frontend

### Visión general
Transformación visual completa: de un diseño genérico con paleta azul/bootstrap a un estilo **elegante, formal y moderno** (inspirado en NYT, BBC, El País). Paleta de colores tipo banca/noticias seria.

### 2.1 Paleta de colores formal

| Token | Valor | Uso |
|-------|-------|-----|
| `--color-primary` | `#0F172A` (carbón) | Navbar, headers, footers |
| `--color-primary-light` | `#1E293B` | Variante más clara |
| `--color-accent` | `#1D4ED8` (azul confiable) | CTAs, links, badges |
| `--color-bg` | `#F8F9FA` | Background general |
| `--color-text` | `#111827` | Títulos |
| `--color-text-secondary` | `#4B5563` | Cuerpo de texto |
| `--color-text-muted` | `#9CA3AF` | Metadatos |

### 2.2 Tipografía

| Uso | Fuente | Estilo |
|-----|--------|--------|
| Títulos de noticias | **Playfair Display** | Serif clásico (news feel) |
| Cuerpo, navbar, todo lo demás | **Inter** | Sans-serif moderna y limpia |

Cargadas desde Google Fonts con `font-display: swap` para evitar FOIT.

### 2.3 Refactor de estructura de archivos

```
Antes:                              Ahora:
frontend/Views/css/*.css           frontend/css/*.css
frontend/Views/index.css           frontend/css/home.css
frontend/Views/detalle-noticia/style.css  frontend/css/detail.css
frontend/Views/auth/auth.css       frontend/css/auth.css
frontend/Views/auth/auth.js        frontend/js/auth.js
```

- Todos los CSS centralizados en `frontend/css/` (8 archivos)
- auth.js movido a `frontend/js/auth.js`
- Archivos viejos eliminados después de migrar rutas

### 2.4 Navbar unificado

**Antes**: Dos barras de navegación (`.top-nav` + `.main-nav`) que ocupaban ~120px de altura vertical.

**Ahora**: Una sola barra sticky con:
```
[NoticiaPTY]  [Todas | Deportes | Política | ...]  [🔍 Buscar...]  [Auth/Usuario]
```

- Sticky en la parte superior, fondo carbón (`#0F172A`)
- Categorías como links horizontales con hover sutil
- Búsqueda integrada en la barra
- Hamburguesa en mobile (≤768px)
- Aplicada en las 9 páginas del sitio

### 2.5 Home Page rediseñada

**Layout jerárquico (nuevo):**
```
┌──────────────────────────────────────────┐
│         HERO — Noticia principal         │
│  [imagen 21:9] [badge] [título serif]   │
│  [excerpt] [meta: autor, fecha, coment]  │
├────────────────┬─────────────────────────┤
│  Feature #2    │    Feature #3           │
│  [img 16:9]    │    [img 16:9]           │
│  [título]      │    [título]             │
├────────────────┴─────────────────────────┤
│  "Últimas Noticias"                      │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │
│  │ card │ │ card │ │ card │ │ card │   │
│  └──────┘ └──────┘ └──────┘ └──────┘   │
│              [Cargar más]                │
└──────────────────────────────────────────┘
```

- **Hero**: Gradiente overlay + badge categoría
- **Feature grid**: 2 columnas, tarjetas con imagen + título + excerpt
- **News grid**: Cards con imagen 16:9, category badge, Playfair title, meta con iconos
- **Skeleton**: Hero skeleton + 6 card skeletons con 300ms debounce
- **Error state**: Icono + mensaje + botón reintentar

### 2.6 Detalle Noticia rediseñado

| Elemento | Antes | Ahora |
|----------|-------|-------|
| Hero imagen | `width: 400px` fijo | 21:9 aspect-ratio, responsive |
| Título | Arial 2.5rem | Playfair Display 2.5rem |
| Meta | Texto plano | Barra con iconos + reading time |
| Like button | Verde sólido (`#28a745`) | Outline rojo, se llena al dar like |
| Comentarios | Sin avatar | Círculo con inicial del usuario |
| Reply button | Verde | Outline sutil |
| Formulario | Básico | Estilizado con focus ring azul |

### 2.7 Auth rediseñado

**Antes**: Gradiente teal `linear-gradient(135deg, #74ebd5, #ACB6E5)` — desactualizado.

**Ahora**: Gradiente oscuro profesional `linear-gradient(135deg, #0F172A, #1E293B)` — elegante.

### 2.8 Admin + Forms

- Todos los colores hardcodeados reemplazados por CSS variables del design system
- Sin cambios de layout (solo refinamiento visual)
- Tablas responsivas preservadas de la fase anterior

### Archivos afectados (24: change completo)

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `frontend/css/design-system.css` | Modificado | Nueva paleta formal + Google Fonts + .category-badge + .news-card-image |
| `frontend/css/home.css` | Renombrado | Hero + feature grid + cards + skeleton (antes index.css) |
| `frontend/css/detail.css` | Renombrado | Artículo elegante con hero + comentarios refinados (antes style.css) |
| `frontend/css/admin-common.css` | Renombrado | Tablas admin con vars (antes paneles-comunes.css) |
| `frontend/css/admin-approval.css` | Renombrado | Aprobación con vars (antes panel_aprobacion.css) |
| `frontend/css/admin-users.css` | Renombrado | Usuarios admin con vars (antes panel_usuarios.css) |
| `frontend/css/form-news.css` | Renombrado | Formularios con vars (antes formulario_noticias.css) |
| `frontend/css/auth.css` | Movido | Gradiente oscuro profesional |
| `frontend/js/auth.js` | Movido | Selectores actualizados para navbar unificado |
| `frontend/Views/index.html` | Modificado | Navbar unificado + hero + feature grid + section header |
| `frontend/Views/index.js` | Modificado | renderHero() + renderFeatures() + renderNewsCard() con badges |
| `frontend/Views/detalle-noticia/index.html` | Modificado | Article page semántico con hero + meta bar + comments |
| `frontend/Views/detalle-noticia/script.js` | Modificado | Comentarios con avatar + like outline + reading time |
| `frontend/Views/administrar-noticia/index.html` | Modificado | Navbar unificado |
| `frontend/Views/administrar-usuario/index.html` | Modificado | Navbar unificado |
| `frontend/Views/crear-noticia/index.html` | Modificado | Navbar unificado |
| `frontend/Views/editar-noticia/index.html` | Modificado | Navbar unificado |
| `frontend/Views/editar-usuario/index.html` | Modificado | Navbar unificado |
| `frontend/Views/auth/iniciar-sesion/index.html` | Modificado | Navbar unificado |
| `frontend/Views/auth/registro/index.html` | Modificado | Navbar unificado |
| `frontend/Views/css/` | Eliminado | Directorio completo (5 CSS migrados) |
| `frontend/Views/index.css` | Eliminado | Migrado a frontend/css/home.css |
| `frontend/Views/detalle-noticia/style.css` | Eliminado | Migrado a frontend/css/detail.css |
| `frontend/Views/auth/auth.css` | Eliminado | Migrado a frontend/css/auth.css |
| `frontend/Views/auth/auth.js` | Eliminado | Migrado a frontend/js/auth.js |

---

## 3. Dockerización del proyecto

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
