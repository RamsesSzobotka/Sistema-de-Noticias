# Errores de Frontend Detectados — Post-Rediseño

> **Fecha**: 10 de junio 2026
> **Contexto**: Los cambios de diseño (rediseño completo + migración a cookies httpOnly + refactor de estructura de archivos) introdujeron múltiples errores en el frontend. Este documento cataloga todos los bugs encontrados para referencia en futuras sesiones.

---

## 🔴 CRÍTICOS — Rompen funcionalidad principal

### 1. Import de `auth.js` roto — archivo movido sin mount `/js`

**Causa raíz**: El archivo `auth.js` se movió de `frontend/Views/auth/auth.js` a `frontend/js/auth.js`, pero el backend no tenía un mount static para `/js` y los imports de 4 JS nunca se actualizaron.

**Archivos afectados**:
| Archivo | Línea | Import roto | Cambio aplicado |
|---------|-------|-------------|-----------------|
| `frontend/Views/index.js` | 2 | `"./auth/auth.js"` | Corregido → `"/js/auth.js"` |
| `frontend/Views/detalle-noticia/script.js` | 2 | `"../auth/auth.js"` | Corregido → `"/js/auth.js"` |
| `frontend/Views/auth/registro/script.js` | 2 | `"../auth.js"` | Corregido → `"/js/auth.js"` |
| `frontend/Views/auth/iniciar-sesion/script.js` | 2 | `"../auth.js"` | Corregido → `"/js/auth.js"` |

**Arreglo**: Se agregó `JS_DIR` y el mount `/js` en `backend/app/Main.py`:
```python
JS_DIR = FRONTEND_DIR / "js"
app.mount("/js", StaticFiles(directory=JS_DIR), name="js")
```

**Síntoma**: Las 4 páginas que usan autenticación (home, detalle noticia, login, registro) no cargaban el módulo `auth.js` → 404 → `verificarSesion()` indefinido → botones de auth no aparecían, login/logout rotos.

---

### 2. `mostrarBotonesPorRol` no importado en detalle-noticia

| Archivo | Línea | Problema |
|---------|-------|----------|
| `frontend/Views/detalle-noticia/script.js` | 2 | Se llamaba `mostrarBotonesPorRol()` en línea 29 pero no estaba importado |

**Arreglo**: Se agregó al import:
```javascript
import { verificarSesion, cerrarSesion, mostrarBotonesPorRol } from "/js/auth.js";
```

**Nota**: Este archivo también tiene una definición local de `mostrarBotonesPorRol` (line 48), por lo que el import es técnicamente redundante pero la función local la shadowea. Se dejó el import por claridad y consistencia.

---

## 🟡 MEDIOS — UX rota o error visual

### 3. `sessionStorage` legacy en detalle-noticia/script.js

| Archivo | Línea | Problema |
|---------|-------|----------|
| `frontend/Views/detalle-noticia/script.js` | 10 | `let usuarioId = sessionStorage.getItem("usuario_id")` — sesión se migró a cookies httpOnly |

**Estado**: **No corregido**. En el DOMContentLoaded handler (línea 22-24) se sobrescribe `usuarioId` con `verificarSesion()`, por lo que el valor inicial de sessionStorage se descarta. Es código muerto, no un bug activo, pero debería limpiarse en el futuro.

---

### 4. `DEFAULT.png` reemplazado por placeholder SVG

| Archivo | Línea | Problema | Cambio aplicado |
|---------|-------|----------|-----------------|
| `frontend/Views/detalle-noticia/script.js` | 337 | Referencia `${API_BASE_URL}/static/imagenesdb/DEFAULT.png` (case-sensitive, rompía en Linux) | Reemplazado por placeholder SVG inline |

**Arreglo**: Se reemplazó la URL del archivo PNG por un SVG inline `data:image/svg+xml` con fondo gris claro y texto "Sin imagen disponible". No depende del sistema de archivos.

---

### 5. Favicon paths incorrectos (6 archivos)

El favicon usa ruta relativa `../assets/logo.png` desde subdirectorios de `Views/`, pero:
- Desde `Views/detalle-noticia/` → `../assets/` va a `Views/assets/` (no existe)
- Desde `Views/auth/registro/` → `../assets/` va a `Views/auth/assets/` (no existe)
- Desde `Views/auth/iniciar-sesion/` → igual
- Desde `Views/editar-usuario/` → `../assets/` va a `Views/assets/` (no existe)
- Desde `Views/administrar-usuario/` → igual
- Desde `Views/editar-noticia/` → igual

**Ruta correcta**: `../../assets/logo.png` (subir 2 niveles hasta `frontend/`).

**Archivos afectados**:
| Archivo | Ruta rota |
|---------|-----------|
| `frontend/Views/detalle-noticia/index.html:13` | `../assets/logo.png` |
| `frontend/Views/auth/registro/index.html:16` | `../assets/logo.png` |
| `frontend/Views/auth/iniciar-sesion/index.html:12` | `../assets/logo.png` |
| `frontend/Views/editar-usuario/index.html:12` | `../assets/logo.png` |
| `frontend/Views/administrar-usuario/index.html:14` | `../assets/logo.png` |
| `frontend/Views/editar-noticia/index.html:7` | `../assets/logo.png` |

**Nota**: `Views/administrar-noticia/index.html` y `Views/crear-noticia/index.html` usan `../../assets/logo.png` → **correctos**.

---

### 6. `spinner.gif` eliminado (usaba SweetAlert2)

| Archivo | Problema | Cambio aplicado |
|---------|----------|-----------------|
| `frontend/Views/auth/iniciar-sesion/index.html` | `<img src="spinner.gif">` no existía en el proyecto | Elemento HTML eliminado (código muerto) |

**Nota**: El login ya tenía SweetAlert2 con loading state (`Swal.showLoading()`) en `script.js:15`. El `<div id="loginLoader">` en el HTML era redundante. Se eliminó.

---

## 🟢 BAJOS — Cosméticos

### 7. `placeholder.jpg` reemplazado por SVG inline

| Archivo | Línea | Problema | Cambio aplicado |
|---------|-------|----------|-----------------|
| `frontend/Views/index.js` | 145 | `../assets/placeholder.jpg` no existía | Reemplazado por placeholder SVG inline `data:image/svg+xml` |

---

## Resumen de cambios aplicados

| Archivo | Cambio |
|---------|--------|
| `backend/app/Main.py` | +`JS_DIR` y mount `/js` para servir `frontend/js/` |
| `frontend/Views/index.js:2` | Import corregido → `/js/auth.js` |
| `frontend/Views/detalle-noticia/script.js:2` | Import corregido → `/js/auth.js` + `mostrarBotonesPorRol` |
| `frontend/Views/auth/registro/script.js:2` | Import corregido → `/js/auth.js` |
| `frontend/Views/auth/iniciar-sesion/script.js:2` | Import corregido → `/js/auth.js` |
| `frontend/Views/detalle-noticia/script.js:337` | `DEFAULT.png` reemplazado por placeholder SVG inline |
| `frontend/Views/auth/iniciar-sesion/index.html:39` | Elemento `spinner.gif` eliminado (código muerto) |
| `frontend/Views/index.js:145` | `placeholder.jpg` reemplazado por SVG inline |
