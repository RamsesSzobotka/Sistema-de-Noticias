# Rediseño de la Página de Perfil de Usuario

**Fecha:** 2026-06-10
**Estado:** Aprobado

## Objetivo
Rediseñar la página de perfil de usuario (/editar-usuario/) para mejorar su apariencia visual, agregar avatar con iniciales del usuario, y añadir sección de cambio de contraseña (backend ya soportado).

## Arquitectura

### Stack
- Frontend vanilla JS + CSS3 con design tokens existentes
- Backend FastAPI (sin cambios - GET /usuarios/me, PUT /usuarios/me, PATCH /usuarios/me/pass ya existen)

### Archivos a modificar
1. `frontend/Views/editar-usuario/index.html` — Nueva estructura con dos tarjetas
2. `frontend/Views/editar-usuario/editar_usuario.js` — Lógica actualizada
3. `frontend/css/profile.css` (nuevo) — Estilos específicos del perfil

### Archivos NO modificados
- `frontend/css/design-system.css` — Usa sus tokens existentes
- `frontend/css/admin-common.css` — Estilos base compartidos
- Backend (ningún archivo .py)

## Diseño Visual

### Layout
```
+--------------------------------------------------+
|  ← Volver al Panel de Noticias                   |
|                                                   |
|  +---- TARJETA DE PERFIL -----------------------+|
|  |                                                ||
|  |   [AB]   Ana Benítez                          ||
|  |          @ana.b                               ||
|  |                                                ||
|  |   Rol: Editor  |  Miembro desde: 10 Ene 2025  ||
|  |                                                ||
|  |   Nombre:  [Ana                   ]            ||
|  |   Apellido:[Benítez               ]            ||
|  |   Usuario: [ana.b                 ]            ||
|  |                                                ||
|  |           [Cancelar]   [Guardar Cambios]       ||
|  +------------------------------------------------+|
|                                                    |
|  +---- TARJETA DE SEGURIDAD ---------------------+|
|  |                                                 ||
|  |   Contraseña actual   [·················]      ||
|  |   Nueva contraseña    [·················]      ||
|  |   Confirmar           [·················]      ||
|  |                                                 ||
|  |           [Actualizar Contraseña]              ||
|  +-------------------------------------------------+
+--------------------------------------------------+
```

### Avatar de iniciales
- Círculo de 80x80px con fondo de color derivado del nombre
- Muestra las iniciales del nombre y apellido en blanco
- Usa el mismo estilo que otras áreas del sistema (background color rotativo basado en hash del nombre)

### Paleta
Usa tokens existentes de `design-system.css`.

### Responsive
- Mobile: avatar y datos en columna, formularios apilados
- Desktop: avatar + info en fila, formularios anchos

## Comportamiento

### Tarjeta de Perfil
- Por defecto: inputs deshabilitados, se muestran datos como texto plano
- Botón "Editar Perfil" toggle: habilita inputs, botón cambia a "Cancelar" + "Guardar Cambios"
- Guardar: PUT /usuarios/me
- Validación básica (campos requeridos)
- El avatar se actualiza si cambia el nombre

### Tarjeta de Seguridad
- Siempre accesible
- Validación: contraseña actual requerida, nueva contraseña 8+ chars con mayúscula, minúscula, número, especial
- Confirmar debe coincidir con nueva contraseña
- Envía PATCH /usuarios/me/pass

## Mejoras adicionales
- Remover estilos inline del HTML, migrar a CSS dedicado
- Mostrar rol del usuario con badge
- Mostrar fecha de creación de la cuenta

## No incluye
- Cambios en backend
- Avatar con foto real (solo iniciales)
