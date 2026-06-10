# Rediseño del Panel de Administración de Usuarios

**Fecha:** 2026-06-10
**Estado:** Aprobado

## Objetivo
Rediseñar el panel de administrador de usuarios del sistema de noticias para mejorar su apariencia visual y usabilidad. Requisito obligatorio: el formulario de creación de usuarios debe ser colapsable (acordeón).

## Arquitectura

### Stack
- Frontend vanilla JS (ES Modules) + CSS3 con custom properties (design-system.css)
- Sin framework — toda la manipulación DOM es JS nativo
- API backend existente (FastAPI) — no se modifican rutas ni controladores

### Archivos a modificar
1. `frontend/css/admin-users.css` — Reescritura completa
2. `frontend/Views/administrar-usuario/index.html` — Nueva estructura HTML
3. `frontend/Views/administrar-usuario/panel_usuarios.js` — Lógica actualizada

### Archivos NO modificados
- `frontend/css/design-system.css` — Usa sus tokens existentes
- `frontend/css/admin-common.css` — Solo si se requiere ajuste menor
- Backend (ningún archivo .py)

## Diseño Visual

### Layout general
```
+--------------------------------------------------+
|  ← Volver al Inicio                              |
|  ⚙️ Administrar Usuarios                         |
|  ------------------------------------------------- |
|  +-----------------------[+] Nuevo Usuario--------+|
|  |  (contenido colapsado por defecto)             ||
|  +------------------------------------------------+|
|  |  Nombre    | Apellido   (grid 2-col)           ||
|  |  Usuario   | Contraseña                        ||
|  |  Rol: [select]          (full width)           ||
|  |              [Crear Usuario]                   ||
|  +------------------------------------------------+|
|  🔍 Buscar...   [Todos] [Activos] [Inactivos]     |
|  +------------------------------------------------+|
|  | Tabla de usuarios con header destacado         ||
|  | Filas con hover, color activo/inactivo         ||
|  | Columna Acciones: [Editar] [Bloquear]          ||
|  +------------------------------------------------+|
|  Paginación                                        |
+--------------------------------------------------+

+-------- MODAL EDITAR USUARIO (overlay) ----------+
|  Nombre: [______]  Apellido: [______]            |
|  Usuario: [______]  Rol: [select]                |
|  Estado: [Activo/Inactivo toggle]                |
|       [Cancelar]  [Guardar Cambios]              |
+--------------------------------------------------+
```

### Paleta
Usa los tokens existentes de `design-system.css`:
- `--color-bg`, `--color-bg-card`, `--color-border`
- `--color-accent`, `--color-accent-dark`
- `--color-success` (activo), `--color-danger` (inactivo/bloquear)
- `--shadow-sm`, `--shadow-md` para cards
- `--radius-md`, `--radius-sm` para bordes

### Responsive
- Mobile (<768px): acordeón 1 columna, tabla en formato card (ya existe en admin-common.css)
- Tablet/Desktop (>768px): grid 2 columnas en formulario, tabla normal

## Comportamiento

### Acordeón del formulario
- Por defecto: colapsado (solo se ve el header con botón "➕ Nuevo Usuario" + ícono chevron)
- Al hacer clic: despliega el formulario con animación suave (max-height transition)
- Al enviar exitosamente: se colapsa automáticamente y refresca la tabla
- Botón "Crear Usuario" dentro del formulario

### Modal de edición
- Al hacer clic en "Editar" por fila: abre un modal HTML (no SweetAlert2) con formulario pre-cargado
- Modal overlay con backdrop oscuro
- Cierra con clic fuera, botón Cancelar, o tecla Escape
- Guardar: envía PATCH a los endpoints correspondientes (rol + datos de usuario)
- Si el backend no tiene endpoint para actualizar nombre/apellido/usuario por ID, se agrega `PATCH /usuarios/{id}`

### Filtros y búsqueda
- Filtros como pills/botones con estilo active
- Búsqueda con debounce (300ms)
- Layout responsivo en desktop e mobile

## Mejoras adicionales
- Remover estilos inline del HTML, migrar a clases CSS
- Remover duplicado de script SweetAlert2
- Remover contenteditable de la tabla (no funcionaba correctamente)
- Botones de acción con íconos (Font Awesome)
- Header con título y descripción del panel

## No incluye
- Backend: solo se agrega `PATCH /usuarios/{id}` si no existe
- Paginación estilo infinito — se mantiene paginación numérica
