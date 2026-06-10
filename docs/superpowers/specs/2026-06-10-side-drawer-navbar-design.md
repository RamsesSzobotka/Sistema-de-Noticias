# Side Drawer Navbar — Design Doc

## Problem
The navbar action buttons (Publicar, Panel, Admin, Perfil, Cerrar Sesión) take up horizontal space in the navbar, making it crowded on mobile and visually noisy on desktop.

## Solution
Move all action buttons into a side drawer that slides in from the right, keeping only the brand, search, and category filter visible in the navbar. The drawer overlays the content (does not push it).

## Scope
- **Desktop & Mobile**: Both get the side drawer for action buttons
- **Search & Category filter**: Remain visible in the navbar at all breakpoints
- **Hamburger icon**: Added/remains in navbar to toggle the drawer

## Architecture

### HTML Structure
Each page's navbar gets two new elements:

1. **Drawer Overlay** — semi-transparent backdrop
2. **Side Drawer** — fixed panel with stacked buttons

### CSS Behavior
- `.side-drawer`: `position: fixed; right: -280px` (hidden) → `right: 0` (open)
- `.drawer-overlay`: `opacity: 0; visibility: hidden` → `opacity: 1; visibility: visible`
- Both use `transition: 0.3s ease`

### Drawer Content
**Logged in users:**
- Publicar (news editors+)
- Panel (supervisors)
- Admin (admins)
- Perfil (all logged in)
- Divider
- Cerrar Sesión (always at bottom)

**Guest users:**
- Iniciar Sesión
- Registrarse

### Behavior
- Click hamburger → open drawer + show overlay
- Click overlay → close drawer + hide overlay
- Click any action button inside drawer → execute action + close drawer
- ESC key → close drawer
- Resize > desktop breakpoint → force close

## Files Modified

### CSS (1 file)
- `frontend/css/design-system.css` — add `.side-drawer`, `.drawer-overlay`, `.drawer-btn`, responsive variants

### HTML (7 files)
- `frontend/Views/index.html`
- `frontend/Views/detalle-noticia/index.html`
- `frontend/Views/crear-noticia/index.html`
- `frontend/Views/editar-noticia/index.html`
- `frontend/Views/administrar-noticia/index.html`
- `frontend/Views/administrar-usuario/index.html`
- `frontend/Views/editar-usuario/index.html`

Each gets: overlay div + drawer div, hamburger button updated, action buttons removed from `.navbar-right` and placed in drawer.

### JS (6+ files)
- `frontend/Views/index.js`
- `frontend/Views/detalle-noticia/script.js`
- `frontend/Views/administrar-noticia/panel_noticias.js`
- `frontend/Views/editar-noticia/editar-noticia.js`
- `frontend/Views/editar-usuario/editar_usuario.js`
- `frontend/Views/crear-noticia/formulario-noticia.js`

Each gets: drawer toggle logic, overlay click handler, ESC listener, close-on-action behavior.
