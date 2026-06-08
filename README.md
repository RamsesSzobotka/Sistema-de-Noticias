# Sistema de Noticias 📰

Un sistema completo de gestión y visualización de noticias con autenticación, comentarios anidados, likes y paneles administrativos.

## Características

### Para Usuarios
- ✅ Registro e inicio de sesión
- ✅ Visualización de noticias
- ✅ Sistema de comentarios anidados (respuestas a comentarios)
- ✅ Sistema de likes
- ✅ Búsqueda de noticias
- ✅ Edición de perfil

### Para Editores
- ✅ Crear noticias
- ✅ Editar noticias propias
- ✅ Panel de administración de noticias (noticias propias)
- ✅ Publicar noticias

### Para Supervisores
- ✅ Todas las funciones de editor
- ✅ Aprobar/rechazar noticias
- ✅ Ver panel de supervisión

### Para Administradores
- ✅ Todas las funciones anteriores
- ✅ Gestionar usuarios
- ✅ Panel administrativo completo

## 🛠️ Tecnologías

### Backend
- **FastAPI** - Framework web moderno
- **Python** - Lenguaje de programación
- **databases** - acceso a base de datos
- **JWT** - Autenticación segura
- **CORS** - Control de acceso entre dominios

### Frontend
- **HTML5** - Estructura
- **CSS3** - Estilos
- **JavaScript (Vanilla)** - Lógica
- **SweetAlert2** - Alertas personalizadas
- **Font Awesome** - Iconos

### Base de Datos
- **PostgreSQL** - Almacenamiento de datos

## 📁 Estructura del Proyecto

```
Sistema-de-Noticias/
├── backend/
│   ├── app/
│   │   ├── Main.py                    # Punto de entrada FastAPI
│   │   ├── core/
│   │   │   ├── ConnectDB.py           # Conexión a BD
│   │   │   └── security.py            # JWT y autenticación
│   │   ├── models/
│   │   │   ├── userModel.py
│   │   │   ├── noticiasModel.py
│   │   │   └── comentarioModel.py
│   │   ├── routers/
│   │   │   ├── authController.py      # Login/Registro
│   │   │   ├── noticiaController.py   # CRUD Noticias
│   │   │   ├── comentarioController.py # CRUD Comentarios
│   │   │   ├── likeController.py      # Sistema de Likes
│   │   │   ├── userController.py      # Gestión de usuarios
│   │   │   └── visitasController.py   # Historial de visitas
│   │   ├── schemas/
│   │   │   ├── userSchema.py
│   │   │   ├── noticiasSchema.py
│   │   │   └── comentarioSchema.py
│   │   ├── utils/
│   │   │   ├── DbHelper.py            # Funciones de BD
│   │   │   ├── HttpError.py           # Manejo de errores
│   │   │   ├── imagen.py              # Procesamiento de imágenes
│   │   │   └── infoVerify.py          # Validaciones
│   │   └── static/
│   │       └── imagenesdb/            # Almacenamiento de imágenes
│   ├── requirements.txt
│   ├── .env                           # Variables de entorno
│   └── backupNoticia.sql              # Backup BD
│
├── frontend/
│   ├── Views/
│   │   ├── index.html                 # Home
│   │   ├── index.js
│   │   ├── index.css
│   │   ├── auth/
│   │   │   ├── iniciar-sesion/        # Login
│   │   │   └── registro/              # Registro
│   │   ├── detalle-noticia/           # Visualizar noticia
│   │   ├── crear-noticia/             # Crear noticia
│   │   ├── editar-noticia/            # Editar noticia
│   │   ├── administrar-noticia/       # Panel noticias
│   │   ├── administrar-usuario/       # Panel usuarios (admin)
│   │   ├── editar-usuario/            # Perfil usuario
│   │   ├── buscar-noticia/            # Búsqueda
│   │   └── css/                       # Estilos compartidos
│   └── assets/                        # Imágenes y recursos
│
└── README.md
```

## Instalación y Configuración

### Backend

#### 1. Clonar repositorio
```bash
git clone <repositorio-url>
cd Sistema-de-Noticias/backend
```

#### 2. Crear entorno virtual
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

#### 3. Instalar dependencias
```bash
pip install -r requirements.txt
```

#### 4. Configurar variables de entorno
Crear `.env`:
```env
DB_USER= usuario_de_tu_bd
DB_PASSWORD= contraseña_de_tu_bd
DB_HOST=host_de_tu_bd
DB_PORT= puerto_de_tu_bd
DB_NAME=noticiapty
SECRET_KEY= clave_secreta_para_jwt
cors_origins= origenes_permitidos_separados_por_comas (usar "*" para  aceptar todos)
ACCESS_TOKEN_EXPIRED_MINUTES=60
REFRESH_TOKEN_EXPIRED_MINUTES=1440
ALGORITHM=algoritmo_a_usar
VALID_ROL=admin,supervisor,editor,global

UPLOAD_DIR = "static/imagenesdb"
```

#### 5. Iniciar servidor
(iniciar desde la carpeta `backend/app`)
```bash
cd backend/app
uvicorn Main:app --reload
```

El servidor estará disponible en `http://127.0.0.1:8000`

**Documentación API interactiva**: `http://127.0.0.1:8000/docs`

---

### Frontend

#### 1. Abrir en servidor local
iniciar uvicorn (servidor) en el backend y acceder a `http://127.0.0.1:8000` desde el navegador.

---

## 📚 Endpoints Principales

### Autenticación
```
POST   /auth/registro           - Registrar usuario
POST   /auth/login              - Iniciar sesión
POST   /auth/admin/register     - Registrar usuario admin (solo admin)
```

### Noticias
```
GET    /noticias/               - Listar todas las noticias
GET    /noticias/{id}           - Obtener noticia por ID
POST   /noticias/               - Crear noticia (Requerido: editor+)
PUT    /noticias/{id}           - Editar noticia
DELETE /noticias/{id}           - Eliminar noticia
```

### Comentarios
```
GET    /comentarios/{noticia_id}      - Obtener comentarios de una noticia
POST   /comentarios/                  - Crear comentario
DELETE /comentarios/?id={id}          - Eliminar comentario
```

### Likes
```
GET    /like/{noticia_id}             - Contar likes de una noticia
GET    /like/me/{noticia_id}          - Verificar si el usuario dio like
POST   /like/?noticiaId={id}          - Dar like a una noticia
DELETE /like/?noticiaId={id}          - Quitar like de una noticia
```

### Usuarios
```
GET    /usuarios/               - Listar usuarios (admin)
GET    /usuarios/{id}           - Obtener usuario por ID
GET    /usuarios/me             - Datos del usuario actual
PUT    /usuarios/{id}           - Editar usuario
DELETE /usuarios/{id}           - Eliminar usuario (admin)
```

---

## 🔐 Roles y Permisos

| Acción | Usuario | Editor | Supervisor | Admin |
|--------|---------|--------|------------|-------|
| Ver noticias | ✅ | ✅ | ✅ | ✅ |
| Crear noticia | ❌ | ✅ | ✅ | ✅ |
| Editar noticia propia | ❌ | ✅ | ✅ | ✅ |
| Eliminar noticia propia | ❌ | ✅ | ✅ | ✅ |
| Aprobar noticias | ❌ | ❌ | ✅ | ✅ |
| Gestionar usuarios | ❌ | ❌ | ❌ | ✅ |
| Eliminar cualquier noticia | ❌ | ❌ | ❌ | ✅ |
| Comentar | ✅ | ✅ | ✅ | ✅ |
| Dar likes | ✅ | ✅ | ✅ | ✅ |

---

## 🐛 Problemas Comunes y Soluciones

### Error: "CORS policy: No 'Access-Control-Allow-Origin' header"
**Solución**: Verificar que el frontend esté en la lista `CORS_ORIGINS` del `.env`

### Error: "Token inválido o expirado"
**Solución**: El token JWT ha expirado. Iniciar sesión nuevamente.

### Las imágenes no cargan
**Solución**: Verificar que la carpeta `static/imagenesdb/` existe y tiene permisos de lectura.

---

## 📝 Notas de Desarrollo

### Variables de sesión (Frontend)
```javascript
sessionStorage.getItem("access_token")   // Token JWT
sessionStorage.getItem("usuario_id")     // ID del usuario
sessionStorage.getItem("usuario")        // Nombre de usuario
sessionStorage.getItem("rol")            // Rol del usuario
```

### Flujo de autenticación
1. Usuario se registra/loguea
2. Backend genera JWT con datos del usuario
3. Frontend guarda token en `sessionStorage`
4. Cada request incluye `Authorization: Bearer <token>`
5. Backend valida token con `getTokenId()`

---

## 📦 Dependencias Principales

### Backend (requirements.txt)
- fastapi
- uvicorn
- sqlalchemy
- databases
- pyjwt
- passlib
- python-dotenv
- pillow (para imágenes)

### Frontend
- SweetAlert2 (CDN)
- Font Awesome (CDN)
- Vanilla JavaScript (sin frameworks externos)

---

**Última actualización**: 11 de noviembre de 2025