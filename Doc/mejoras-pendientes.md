# Mejoras Pendientes

---

## 🟡 Calidad de código (media prioridad)

### 1. Extraer queries duplicadas en noticiasController

**Archivo**: `backend/app/controllers/noticiasController.py`

**Problema**: 5 consultas SQL casi idénticas (mismo JOIN + `json_agg`) están repetidas en diferentes funciones. Cualquier cambio en la estructura de la consulta requiere editar 5 lugares.

**Solución propuesta**: Extraer a un helper privado que acepte parámetros (filtro activo/inactivo, búsqueda, paginación). Mantener las funciones públicas delgadas que solo agregan los filtros específicos.

**Esfuerzo**: Bajo · **Archivos afectados**: 1

---

### 2. Centralizar CryptContext

**Archivo**: `backend/app/controllers/authController.py:10`, `userController.py:11`, `migrate.py:10`

**Problema**: 3 instancias separadas de `CryptContext(schemes=["bcrypt"])` en distintos archivos. Si se cambia el esquema de hashing, hay que actualizar los 3 lugares.

**Solución propuesta**: Mover la instancia a `core/security.py` y re-exportarla o pasarla como dependencia.

**Esfuerzo**: Bajo · **Archivos afectados**: 4

---

### 3. Hardcoded `validCategoria`

**Archivo**: `backend/app/utils/infoVerify.py:178`

**Problema**: El rango de categorías válidas está hardcodeado como `1 <= categoria <= 4`. Si se agregan más categorías a la DB, el código se desincroniza.

**Solución propuesta**: Consultar las categorías desde la BD dinámicamente, o leer desde una constante/configuración en vez de hardcodear.

**Esfuerzo**: Bajo · **Archivos afectados**: 1

---

### 4. Agregar validaciones a modelos Pydantic

**Archivos**: `models/userModel.py`, `models/noticiasModel.py`, `models/comentarioModel.py`

**Problema**: Los modelos carecen de `min_length`, `max_length`, `regex` en los campos `str`. La BD tiene límites (VARCHAR(25), VARCHAR(50), etc.) pero no se validan a nivel de modelo.

**Solución propuesta**: Agregar `Field(min_length=..., max_length=...)` a los campos correspondientes.

| Campo | DB | Validación propuesta |
|-------|----|--------------------|
| usuarios.nombre | VARCHAR(25) | `Field(min_length=1, max_length=25)` |
| usuarios.apellido | VARCHAR(25) | `Field(min_length=1, max_length=25)` |
| usuarios.usuario | VARCHAR(50) | `Field(min_length=3, max_length=50)` |
| noticias.titulo | VARCHAR(250) | `Field(min_length=1, max_length=250)` |
| noticias.autor | VARCHAR(100) | `Field(min_length=1, max_length=100)` |

**Esfuerzo**: Bajo · **Archivos afectados**: 3

---

### 5. Eliminar dead code

| Archivo | Código muerto |
|---------|---------------|
| `controllers/noticiasController.py:1` | `from pickle import FALSE` (nunca usado) |

**Esfuerzo**: Mínimo

---

## 🟢 UX/UI (baja prioridad)

### 6. Loading states faltantes

**Archivos**: `index.js`, `detalle-noticia/script.js`

**Problema**: La carga de noticias y comentarios no muestra indicadores visuales de carga. En conexiones lentas, el usuario ve una pantalla vacía sin retroalimentación.

**Solución propuesta**: Agregar spinners CSS o skeletons mientras se complete el fetch. Usar el patrón ya existente de Swal.showLoading() en formularios.

**Esfuerzo**: Bajo

---

### 7. Eliminar dependencia de SweetAlert2 CDN

**Archivo**: `index.html`

**Problema**: SweetAlert2 se carga via CDN externo. Si el CDN falla, las alertas no funcionan y la app se degrada silenciosamente.

**Solución propuesta**: Descargar SweetAlert2 y servirlo localmente, o migrar a una alternativa más liviana. Alternativa: incluir como dependencia npm si se agrega un build step.

**Esfuerzo**: Bajo

---

## 🔵 Arquitectura (futuro)

### 8. Modelos incompletos vs esquema de BD

**Problema**: Varios modelos Pydantic no representan completamente las tablas de la BD:

| Tabla | Campo faltante en modelo |
|-------|-------------------------|
| `usuarios` | `activo`, `create_time`, `updated_at` |
| `noticias` | `activo`, `fecha_creacion`, `usuario_id` |
| `comentarios` | `usuario_id`, `fecha_creacion` |

**Solución propuesta**: Separar en `*Create` / `*Response` (Command-Query separation). Los modelos de creación no necesitan `id` ni timestamps, pero los de respuesta sí deben representar el esquema completo.

**Esfuerzo**: Medio · **Archivos afectados**: 3 modelos + schemas

---

### 9. Sin modelos para categorias, imagenes, likes, visitas

**Problema**: 4 tablas no tienen representación como modelos Pydantic. Los datos se manejan como dicts crudos, sin validación de tipos ni documentación de estructura.

**Solución propuesta**: Crear modelos para `Categoria`, `Imagen`, `Like`, `Visita`.

**Esfuerzo**: Bajo

---

### 10. Endpoints no RESTful

| Endpoint actual | Propuesta |
|----------------|-----------|
| `DELETE /noticia/?id=X` | `DELETE /noticia/{id}` |
| `DELETE /like/?noticiaId=X` | `DELETE /like/{noticiaId}` |
| `PATCH /usuarios/update/rol?id=X&rol=Y` | `PATCH /usuarios/{id}/rol` con body |

**Solución propuesta**: Migrar a rutas con path parameters. Mantener compatibilidad temporal con query params.

**Esfuerzo**: Medio · **Archivos afectados**: routers + controllers

---

## Resumen

| Prioridad | Items | Esfuerzo |
|-----------|-------|----------|
| 🟡 Media | 5 | Bajo (2-4h total) |
| 🟢 Baja | 2 | Bajo (1-2h) |
| 🔵 Futuro | 3 | Medio (4-8h) |
