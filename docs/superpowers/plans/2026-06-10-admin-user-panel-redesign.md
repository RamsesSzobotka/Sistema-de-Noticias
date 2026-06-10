# Rediseño Panel Admin Usuarios — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar el panel de administración de usuarios: formulario de creación en acordeón colapsable, edición por modal, mejoras visuales generales.

**Architecture:** Frontend vanilla JS + CSS3 con design tokens existentes. Backend FastAPI. Se agrega un endpoint PATCH /usuarios/{id} para edición de nombre/apellido/usuario por admin. No se modifica la estructura general de la app.

**Tech Stack:** Python/FastAPI (backend), vanilla JS (frontend), CSS3 con custom properties, SweetAlert2, Font Awesome 6.

---

### Task 1: Backend — Agregar PATCH /usuarios/{id}

**Files:**
- Modify: `backend/app/controllers/userController.py` (agregar función)
- Modify: `backend/app/routers/userRouter.py` (agregar ruta)

- [ ] **Step 1: Agregar `updateUserById` en userController.py**

Agregar después de `updateUser` (línea 118), antes del `except` de `updateRol`:

```python
# Actualizar usuario por ID (solo administradores)
async def updateUserById(id: int, user: Usuarios):
    try:
        async with db.transaction():
            existing = await searchUser(id, 1)
            if not existing:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Usuario inexistente"
                )

            existingUser = await searchUser(user.usuario, 2)
            if existingUser and existingUser["id"] != id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="El nombre de usuario ya está en uso"
                )

            query = """
                UPDATE usuarios 
                SET nombre = :nombre, apellido = :apellido, usuario = :usuario 
                WHERE id = :id 
                RETURNING id
            """
            values = {
                "id": id,
                "nombre": user.nombre,
                "apellido": user.apellido,
                "usuario": user.usuario
            }

            result = await db.fetch_val(query, values)

            if not result:
                raise errorInterno()

            return {"detail": "Usuario actualizado exitosamente"}
    except HTTPException:
        raise
    except Exception:
        raise errorInterno()
```

- [ ] **Step 2: Agregar ruta PATCH /usuarios/{id} en userRouter.py**

Agregar después de `updateActivo` (línea 35):

```python
# Actualizar datos de un usuario por ID (solo administradores)
@router.patch("/{id}", status_code=status.HTTP_200_OK)
async def updateUserById(id: int, user: Usuarios, _: bool = Depends(isAdmin)):
    return await User.updateUserById(id, user)
```

- [ ] **Step 3: Verificar que el servidor inicia sin errores**

Run: `cd backend && python -c "from app.Main import app; print('OK')"` (o el comando apropiado para tu entorno)
Expected: No import errors

- [ ] **Step 4: Commit backend change**

```bash
git add backend/app/controllers/userController.py backend/app/routers/userRouter.py
git commit -m "feat: add PATCH /usuarios/{id} endpoint for admin user editing"
```

---

### Task 2: CSS — Rediseñar admin-users.css

**Files:**
- Rewrite: `frontend/css/admin-users.css`

- [ ] **Step 1: Reescribir admin-users.css con el nuevo diseño**

Reemplazar TODO el contenido de `frontend/css/admin-users.css` con:

```css
/* ============================================================
   Admin Users Panel — Estilos
   ============================================================ */

/* ---- Panel Header ---- */
.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-lg);
  flex-wrap: wrap;
  gap: var(--space-md);
}

.admin-header h2 {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text);
  margin: 0;
}

.admin-header p {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  margin: 0;
}

/* ---- Accordion (formulario colapsable) ---- */
.accordion {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.accordion-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) var(--space-lg);
  cursor: pointer;
  user-select: none;
  transition: background var(--transition-fast);
}

.accordion-header:hover {
  background: var(--color-border-light);
}

.accordion-header-left {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-base);
  color: var(--color-text);
}

.accordion-header-left i {
  color: var(--color-accent);
  font-size: var(--font-size-lg);
}

.accordion-icon {
  transition: transform var(--transition-normal);
  color: var(--color-text-muted);
}

.accordion-icon.open {
  transform: rotate(180deg);
}

.accordion-body {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.35s ease, padding 0.35s ease;
}

.accordion-body.open {
  max-height: 600px; /* suficiente para el formulario */
}

.accordion-content {
  padding: 0 var(--space-lg) var(--space-lg) var(--space-lg);
  border-top: 1px solid var(--color-border);
}

/* ---- Formulario ---- */
.user-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
  margin-top: var(--space-md);
}

.user-form .form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.user-form .form-group.full-width {
  grid-column: 1 / -1;
}

.user-form .form-group label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
}

.user-form .form-group input,
.user-form .form-group select {
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  font-family: var(--font-family-body);
  background: var(--color-bg-card);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  outline: none;
  width: 100%;
  box-sizing: border-box;
}

.user-form .form-group input:focus,
.user-form .form-group select:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.1);
}

.user-form .form-group input::placeholder {
  color: var(--color-text-muted);
}

.form-actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
  margin-top: var(--space-sm);
}

/* ---- Search & Filters Bar ---- */
.search-filters-bar {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
  flex-wrap: wrap;
}

.search-wrapper {
  position: relative;
  flex: 1;
  min-width: 200px;
  max-width: 360px;
}

.search-wrapper input {
  width: 100%;
  padding: 10px 12px 10px 36px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-family: var(--font-family-body);
  background: var(--color-bg-card);
  outline: none;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  box-sizing: border-box;
}

.search-wrapper input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.1);
}

.search-wrapper .search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  pointer-events: none;
}

.filter-pills {
  display: flex;
  gap: var(--space-xs);
  flex-wrap: wrap;
}

.filter-pill {
  padding: 6px 14px;
  border: 1px solid var(--color-border);
  border-radius: 20px;
  background: var(--color-bg-card);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-family: var(--font-family-body);
}

.filter-pill:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
  background: var(--color-accent-light);
}

.filter-pill.active {
  background: var(--color-accent);
  color: var(--color-white);
  border-color: var(--color-accent);
}

/* ---- Table ---- */
.table-container {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead th {
  background: var(--color-bg);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 12px var(--space-md);
  text-align: left;
  border-bottom: 2px solid var(--color-border);
}

tbody td {
  padding: 12px var(--space-md);
  font-size: var(--font-size-sm);
  border-bottom: 1px solid var(--color-border-light);
  vertical-align: middle;
}

tbody tr:last-child td {
  border-bottom: none;
}

tbody tr {
  transition: background var(--transition-fast);
}

tbody tr:hover {
  background: rgba(0, 0, 0, 0.02);
}

tbody tr.active {
  background: rgba(5, 150, 99, 0.04);
}

tbody tr.active:hover {
  background: rgba(5, 150, 99, 0.08);
}

tbody tr.inactive {
  background: rgba(220, 38, 38, 0.04);
}

tbody tr.inactive:hover {
  background: rgba(220, 38, 38, 0.08);
}

/* Status badges */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
}

.status-badge.active {
  background: rgba(5, 150, 99, 0.1);
  color: var(--color-success);
}

.status-badge.inactive {
  background: rgba(220, 38, 38, 0.1);
  color: var(--color-danger);
}

.role-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  background: var(--color-accent-light);
  color: var(--color-accent);
}

/* Action buttons */
.action-buttons {
  display: flex;
  gap: var(--space-xs);
}

.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
  background: var(--color-bg-card);
  color: var(--color-text);
  font-family: var(--font-family-body);
}

.btn-icon:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
  background: var(--color-accent-light);
}

.btn-icon.btn-edit:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
  background: var(--color-accent-light);
}

.btn-icon.btn-toggle {
  border-color: var(--color-warning);
  color: var(--color-warning);
}

.btn-icon.btn-toggle:hover {
  background: rgba(217, 119, 6, 0.1);
}

/* ---- Modal ---- */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  opacity: 0;
  visibility: hidden;
  transition: opacity var(--transition-normal), visibility var(--transition-normal);
}

.modal-overlay.open {
  opacity: 1;
  visibility: visible;
}

.modal {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  transform: scale(0.95);
  transition: transform var(--transition-normal);
}

.modal-overlay.open .modal {
  transform: scale(1);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-lg);
  border-bottom: 1px solid var(--color-border);
}

.modal-header h3 {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text);
}

.modal-close {
  background: none;
  border: none;
  font-size: var(--font-size-xl);
  cursor: pointer;
  color: var(--color-text-muted);
  padding: 4px;
  line-height: 1;
  transition: color var(--transition-fast);
}

.modal-close:hover {
  color: var(--color-text);
}

.modal-body {
  padding: var(--space-lg);
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.modal-form .form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.modal-form .form-group label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
}

.modal-form .form-group input,
.modal-form .form-group select {
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  font-family: var(--font-family-body);
  outline: none;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.modal-form .form-group input:focus,
.modal-form .form-group select:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.1);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  border-top: 1px solid var(--color-border);
}

/* ---- Buttons ---- */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 20px;
  border: none;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-family: var(--font-family-body);
}

.btn-primary {
  background: var(--color-accent);
  color: var(--color-white);
}

.btn-primary:hover {
  background: var(--color-accent-dark);
}

.btn-secondary {
  background: var(--color-bg);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  background: var(--color-border-light);
}

.btn-danger {
  background: var(--color-danger);
  color: var(--color-white);
}

.btn-danger:hover {
  background: var(--color-danger-dark);
}

/* ---- Pagination ---- */
.paginacion-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  padding: var(--space-md);
  flex-wrap: wrap;
}

.pagina-btn {
  min-width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-card);
  color: var(--color-text);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-family: var(--font-family-body);
  padding: 0 8px;
}

.pagina-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.pagina-btn.activa {
  background: var(--color-accent);
  color: var(--color-white);
  border-color: var(--color-accent);
}

/* ---- Responsive ---- */
@media (max-width: 768px) {
  .user-form {
    grid-template-columns: 1fr;
  }

  .user-form .form-group.full-width {
    grid-column: 1;
  }

  .form-actions {
    flex-direction: column;
  }

  .form-actions .btn {
    width: 100%;
  }

  .search-filters-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-wrapper {
    max-width: none;
  }

  .filter-pills {
    justify-content: center;
  }

  .action-buttons {
    flex-direction: column;
    gap: var(--space-xs);
  }

  .admin-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/css/admin-users.css
git commit -m "feat: redesign admin-users.css with accordion, modal, pills, and table enhancements"
```

---

### Task 3: HTML — Restructurar index.html

**Files:**
- Modify: `frontend/Views/administrar-usuario/index.html`

- [ ] **Step 1: Reemplazar el HTML del panel**

Reemplazar TODO el contenido dentro del `<div class="container">` (líneas 119-180), manteniendo el navbar y scripts externos. El nuevo contenido:

```html
<div class="container">
  <!-- Header -->
  <div class="admin-header">
    <div>
      <h2><i class="fas fa-users-cog"></i> Administrar Usuarios</h2>
      <p>Gestiona los usuarios del sistema: crea, edita, activa o desactiva cuentas.</p>
    </div>
  </div>

  <!-- Accordion: Formulario para agregar usuario -->
  <div class="accordion" id="accordionAddUser">
    <div class="accordion-header" id="accordionToggle">
      <div class="accordion-header-left">
        <i class="fas fa-user-plus"></i>
        <span>Nuevo Usuario</span>
      </div>
      <i class="fas fa-chevron-down accordion-icon" id="accordionIcon"></i>
    </div>
    <div class="accordion-body" id="accordionBody">
      <div class="accordion-content">
        <form id="formAddUser" class="user-form">
          <div class="form-group">
            <label for="nombre">Nombre</label>
            <input type="text" id="nombre" placeholder="Nombre del usuario" required />
          </div>
          <div class="form-group">
            <label for="apellido">Apellido</label>
            <input type="text" id="apellido" placeholder="Apellido del usuario" required />
          </div>
          <div class="form-group">
            <label for="usuario">Usuario</label>
            <input type="text" id="usuario" placeholder="Nombre de usuario" required />
          </div>
          <div class="form-group">
            <label for="contrasena">Contraseña</label>
            <input type="password" id="contrasena" placeholder="Contraseña segura" required />
          </div>
          <div class="form-group full-width">
            <label for="rol">Rol</label>
            <select id="rol" required>
              <option value="">Seleccione un rol</option>
              <option value="editor">Editor</option>
              <option value="global">Global</option>
              <option value="admin">Admin</option>
              <option value="supervisor">Supervisor</option>
            </select>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">
              <i class="fas fa-save"></i> Crear Usuario
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- Search & Filters -->
  <div class="search-filters-bar">
    <div class="search-wrapper">
      <i class="fas fa-search search-icon"></i>
      <input
        type="text"
        id="buscadorUsuarios"
        placeholder="Buscar por nombre, apellido o usuario..."
      />
    </div>
    <div class="filter-pills" id="filtrosUsuarios">
      <button class="filter-pill active" data-filtro="todos">Todos</button>
      <button class="filter-pill" data-filtro="activos">Activos</button>
      <button class="filter-pill" data-filtro="inactivos">Inactivos</button>
      <button class="filter-pill" data-filtro="supervisor">Supervisores</button>
      <button class="filter-pill" data-filtro="editor">Editores</button>
      <button class="filter-pill" data-filtro="admin">Admin</button>
    </div>
  </div>

  <!-- Users Table -->
  <div class="table-container">
    <table id="usersTable">
      <thead>
        <tr>
          <th>ID</th>
          <th>Nombre</th>
          <th>Apellido</th>
          <th>Usuario</th>
          <th>Rol</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <!-- Poblado por JS -->
      </tbody>
    </table>
  </div>

  <!-- Pagination -->
  <div id="paginacionUsuarios" class="paginacion-container"></div>
</div>

<!-- Modal de edición -->
<div class="modal-overlay" id="editModalOverlay">
  <div class="modal" id="editModal">
    <div class="modal-header">
      <h3><i class="fas fa-user-edit"></i> Editar Usuario</h3>
      <button class="modal-close" id="editModalClose">&times;</button>
    </div>
    <div class="modal-body">
      <form id="editUserForm" class="modal-form">
        <input type="hidden" id="editUserId" />
        <div class="form-group">
          <label for="editNombre">Nombre</label>
          <input type="text" id="editNombre" required />
        </div>
        <div class="form-group">
          <label for="editApellido">Apellido</label>
          <input type="text" id="editApellido" required />
        </div>
        <div class="form-group">
          <label for="editUsuario">Usuario</label>
          <input type="text" id="editUsuario" required />
        </div>
        <div class="form-group">
          <label for="editRol">Rol</label>
          <select id="editRol" required>
            <option value="editor">Editor</option>
            <option value="global">Global</option>
            <option value="admin">Admin</option>
            <option value="supervisor">Supervisor</option>
          </select>
        </div>
      </form>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" id="editModalCancel">Cancelar</button>
      <button class="btn btn-primary" id="editModalSave">
        <i class="fas fa-save"></i> Guardar Cambios
      </button>
    </div>
  </div>
</div>
```

Remover también el SweetAlert2 duplicado (la línea 182 `<script src="...">` es duplicado de la línea 111, eliminar la de línea 182).

Y remover la etiqueta `<div style="margin-bottom: 20px;">` con el botón de volver (líneas 113-118) — ya que el `volver-btn` se mantiene en el container.

- [ ] **Step 2: Commit**

```bash
git add frontend/Views/administrar-usuario/index.html
git commit -m "feat: restructure admin user panel with accordion form and edit modal"
```

---

### Task 4: JS — Actualizar panel_usuarios.js

**Files:**
- Modify: `frontend/Views/administrar-usuario/panel_usuarios.js`

- [ ] **Step 1: Reemplazar TODO el contenido de panel_usuarios.js**

```javascript
import { API_BASE_URL } from "/config/config.js";
import { verificarSesion, cerrarSesion, initNavbar, cargarVisitas } from "/js/auth.js";

const apiUrl = `${API_BASE_URL}/usuarios/`;
let usuariosCargados = [];

/* ===================================================
   Session & Permissions
   =================================================== */
async function verificarSesionYPermiso() {
  try {
    const session = await verificarSesion();
    if (!session || session.rol.toLowerCase() !== "admin") {
      Swal.fire({
        icon: "error",
        title: "Acceso denegado",
        text: "No tienes permisos para acceder a esta seccion."
      }).then(() => window.location.href = "/");
      return;
    }
    initNavbar(session);
    cargarVisitas();
    initAccordion();
    initModal();
    await cargarUsuarios();
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: error.message || "No se pudo verificar la sesion."
    });
  }
}

/* ===================================================
   Accordion (formulario colapsable)
   =================================================== */
function initAccordion() {
  const header = document.getElementById("accordionToggle");
  const body = document.getElementById("accordionBody");
  const icon = document.getElementById("accordionIcon");

  if (!header || !body || !icon) return;

  header.addEventListener("click", () => {
    const isOpen = body.classList.toggle("open");
    icon.classList.toggle("open", isOpen);
  });
}

function collapseAccordion() {
  const body = document.getElementById("accordionBody");
  const icon = document.getElementById("accordionIcon");
  if (body) body.classList.remove("open");
  if (icon) icon.classList.remove("open");
}

/* ===================================================
   Create User
   =================================================== */
async function registrarAdmin() {
  const nombre = document.getElementById("nombre").value.trim();
  const apellido = document.getElementById("apellido").value.trim();
  const usuario = document.getElementById("usuario").value.trim();
  const contrasena = document.getElementById("contrasena").value.trim();
  const rol = document.getElementById("rol").value.trim();

  if (!nombre || !apellido || !usuario || !contrasena || !rol) {
    Swal.fire("Error", "Todos los campos son obligatorios.", "error");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/admin/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, apellido, usuario, contrasena, rol }),
    });
    const result = await response.json();
    if (response.ok) {
      Swal.fire("Exito", result.detail, "success");
      document.getElementById("formAddUser").reset();
      collapseAccordion();
      await cargarUsuarios();
    } else {
      Swal.fire("Error", result.detail || "Error al registrar usuario", "error");
    }
  } catch (error) {
    Swal.fire("Error", "No se pudo conectar con el servidor.", "error");
  }
}

/* ===================================================
   Modal (editar usuario)
   =================================================== */
let editingUserId = null;

function initModal() {
  const overlay = document.getElementById("editModalOverlay");
  const closeBtn = document.getElementById("editModalClose");
  const cancelBtn = document.getElementById("editModalCancel");
  const saveBtn = document.getElementById("editModalSave");

  if (!overlay) return;

  function closeModal() {
    overlay.classList.remove("open");
    editingUserId = null;
  }

  closeBtn?.addEventListener("click", closeModal);
  cancelBtn?.addEventListener("click", closeModal);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("open")) closeModal();
  });

  saveBtn?.addEventListener("click", guardarEdicion);
}

function openEditModal(user) {
  editingUserId = user.id;
  document.getElementById("editUserId").value = user.id;
  document.getElementById("editNombre").value = user.nombre;
  document.getElementById("editApellido").value = user.apellido;
  document.getElementById("editUsuario").value = user.usuario;
  document.getElementById("editRol").value = user.rol;

  const overlay = document.getElementById("editModalOverlay");
  overlay.classList.add("open");
}

async function guardarEdicion() {
  if (!editingUserId) return;

  const nombre = document.getElementById("editNombre").value.trim();
  const apellido = document.getElementById("editApellido").value.trim();
  const usuario = document.getElementById("editUsuario").value.trim();
  const rol = document.getElementById("editRol").value.trim();

  if (!nombre || !apellido || !usuario) {
    Swal.fire("Error", "Todos los campos son obligatorios.", "error");
    return;
  }

  try {
    // Actualizar datos personales
    const res1 = await fetch(`${apiUrl}${editingUserId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, apellido, usuario }),
    });
    const result1 = await res1.json();
    if (!res1.ok) throw new Error(result1.detail || "Error al actualizar usuario");

    // Actualizar rol
    const res2 = await fetch(`${apiUrl}update/rol?id=${editingUserId}&rol=${rol}`, {
      method: "PATCH",
    });
    const result2 = await res2.json();
    if (!res2.ok) throw new Error(result2.detail || "Error al actualizar rol");

    Swal.fire("Exito", "Usuario actualizado correctamente", "success");
    document.getElementById("editModalOverlay").classList.remove("open");
    editingUserId = null;
    await cargarUsuarios();
  } catch (error) {
    Swal.fire("Error", error.message, "error");
  }
}

/* ===================================================
   Render Users Table
   =================================================== */
function renderizarUsuarios(usuarios) {
  const tbody = document.querySelector("#usersTable tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  usuarios.forEach(user => {
    const tr = document.createElement("tr");
    tr.className = user.activo == 1 ? "active" : "inactive";

    function addCell(text, label) {
      const td = document.createElement("td");
      td.textContent = text;
      if (label) td.setAttribute("data-label", label);
      return td;
    }

    tr.appendChild(addCell(user.id, "ID"));
    tr.appendChild(addCell(user.nombre, "Nombre"));
    tr.appendChild(addCell(user.apellido, "Apellido"));
    tr.appendChild(addCell(user.usuario, "Usuario"));

    // Rol badge
    const tdRol = document.createElement("td");
    tdRol.setAttribute("data-label", "Rol");
    const roleBadge = document.createElement("span");
    roleBadge.className = "role-badge";
    roleBadge.textContent = user.rol.charAt(0).toUpperCase() + user.rol.slice(1);
    tdRol.appendChild(roleBadge);
    tr.appendChild(tdRol);

    // Estado badge
    const tdEstado = document.createElement("td");
    tdEstado.setAttribute("data-label", "Estado");
    const statusBadge = document.createElement("span");
    statusBadge.className = `status-badge ${user.activo == 1 ? "active" : "inactive"}`;
    statusBadge.innerHTML = user.activo == 1
      ? '<i class="fas fa-check-circle"></i> Activo'
      : '<i class="fas fa-times-circle"></i> Inactivo';
    tdEstado.appendChild(statusBadge);
    tr.appendChild(tdEstado);

    // Acciones
    const tdAcciones = document.createElement("td");
    tdAcciones.setAttribute("data-label", "Acciones");

    const actionsDiv = document.createElement("div");
    actionsDiv.className = "action-buttons";

    const btnEdit = document.createElement("button");
    btnEdit.className = "btn-icon btn-edit";
    btnEdit.dataset.action = "edit";
    btnEdit.dataset.id = user.id;
    btnEdit.innerHTML = '<i class="fas fa-pen"></i> Editar';
    actionsDiv.appendChild(btnEdit);

    const btnToggle = document.createElement("button");
    btnToggle.className = "btn-icon btn-toggle";
    btnToggle.dataset.action = "toggle";
    btnToggle.dataset.id = user.id;
    btnToggle.innerHTML = user.activo == 1
      ? '<i class="fas fa-ban"></i> Bloquear'
      : '<i class="fas fa-check"></i> Activar';
    actionsDiv.appendChild(btnToggle);

    tdAcciones.appendChild(actionsDiv);
    tr.appendChild(tdAcciones);
    tbody.appendChild(tr);
  });
}

/* ===================================================
   Fetch Users
   =================================================== */
async function cargarUsuarios(filtro = "todos", page = 1, size = 10) {
  const tbody = document.querySelector("#usersTable tbody");
  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="7"><div class="spinner"></div></td></tr>';
  }

  try {
    const res = await fetch(`${apiUrl}?filtro=${filtro}&page=${page}&size=${size}`);
    if (!res.ok) throw new Error("Error al obtener la lista de usuarios");
    const data = await res.json();
    usuariosCargados = data.usuarios || [];
    renderizarUsuarios(usuariosCargados);
    generarPaginacionUsuarios(data.total_pages || 1, data.page || page, filtro);
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudieron cargar los usuarios."
    });
  }
}

function generarPaginacionUsuarios(totalPaginas, paginaActual, filtroActual = "todos") {
  const contenedor = document.getElementById("paginacionUsuarios");
  if (!contenedor) return;
  contenedor.innerHTML = "";
  if (totalPaginas < 1) totalPaginas = 1;
  for (let i = 1; i <= totalPaginas; i++) {
    const boton = document.createElement("button");
    boton.textContent = i;
    boton.classList.add("pagina-btn");
    if (i === paginaActual) boton.classList.add("activa");
    boton.addEventListener("click", () => cargarUsuarios(filtroActual, i));
    contenedor.appendChild(boton);
  }
}

/* ===================================================
   Search
   =================================================== */
let searchTimeout = null;

async function buscarUsuariosBackend(termino) {
  if (!termino.trim()) return await cargarUsuarios();
  try {
    const res = await fetch(`${apiUrl}buscar?query=${encodeURIComponent(termino)}`);
    if (!res.ok) throw new Error("Error al realizar la busqueda");
    const data = await res.json();
    usuariosCargados = data.usuarios || [];
    renderizarUsuarios(usuariosCargados);
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo realizar la busqueda."
    });
  }
}

/* ===================================================
   Event Listeners
   =================================================== */

// Accordion form submit
document.getElementById("formAddUser")?.addEventListener("submit", e => {
  e.preventDefault();
  registrarAdmin();
});

// Search with debounce
document.getElementById("buscadorUsuarios")?.addEventListener("input", e => {
  clearTimeout(searchTimeout);
  const termino = e.target.value.trim();
  searchTimeout = setTimeout(() => {
    if (!termino) { cargarUsuarios(); return; }
    buscarUsuariosBackend(termino);
  }, 300);
});

// Filter pills
document.getElementById("filtrosUsuarios")?.addEventListener("click", e => {
  const btn = e.target.closest(".filter-pill");
  if (!btn) return;

  // Update active pill
  document.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
  btn.classList.add("active");

  const map = {
    activos: "activo",
    inactivos: "inactivo",
    supervisor: "supervisor",
    editor: "editor",
    admin: "admin"
  };
  cargarUsuarios(map[btn.dataset.filtro] || "todos");
});

// Table actions (delegation)
document.querySelector("#usersTable tbody")?.addEventListener("click", async e => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;

  const id = btn.dataset.id;
  const action = btn.dataset.action;

  if (action === "toggle") {
    try {
      const res = await fetch(`${apiUrl}activo/${id}`, { method: "PATCH" });
      const result = await res.json();
      if (res.ok) {
        Swal.fire("Exito", "Estado actualizado correctamente", "success");
        await cargarUsuarios();
      } else {
        Swal.fire("Error", result.detail || "Error al cambiar estado", "error");
      }
    } catch (error) {
      Swal.fire("Error", "No se pudo conectar con el servidor.", "error");
    }
  }

  if (action === "edit") {
    const user = usuariosCargados.find(u => u.id == id);
    if (user) openEditModal(user);
  }
});

// Init
document.addEventListener("DOMContentLoaded", verificarSesionYPermiso);
```

- [ ] **Step 2: Commit**

```bash
git add frontend/Views/administrar-usuario/panel_usuarios.js
git commit -m "feat: rewrite panel_usuarios.js with accordion, modal editing, search debounce"
```

---

### Task 5: Verificación final

**Files:** All modified files

- [ ] **Step 1: Verificar que el servidor backend inicia sin errores**

Run: `cd backend && python -m uvicorn app.Main:app --reload` (o script existente)
Expected: Server starts, no import errors

- [ ] **Step 2: Abrir la página en navegador y verificar**
  - [ ] El formulario se muestra colapsado por defecto
  - [ ] Al hacer clic en "Nuevo Usuario" se despliega el formulario
  - [ ] Al enviar el formulario se crea el usuario, se colapsa y se refresca la tabla
  - [ ] Los filtros funcionan y el activo tiene estilo de pill
  - [ ] La búsqueda funciona con debounce
  - [ ] Al hacer clic en "Editar" se abre el modal con datos precargados
  - [ ] Al guardar en el modal se actualizan los datos y se cierra
  - [ ] Al hacer clic en "Bloquear/Activar" cambia el estado
  - [ ] La paginación funciona
  - [ ] Responsive: en mobile se ve correctamente

- [ ] **Step 3: Commit final si hay ajustes**

```bash
git add -A
git commit -m "fix: adjustments after verification"
```

---

## Resumen de archivos modificados

| Archivo | Cambio |
|---------|--------|
| `backend/app/controllers/userController.py` | + `updateUserById()` |
| `backend/app/routers/userRouter.py` | + ruta `PATCH /usuarios/{id}` |
| `frontend/css/admin-users.css` | Reescritura completa |
| `frontend/Views/administrar-usuario/index.html` | Accordion + modal + search-filters bar |
| `frontend/Views/administrar-usuario/panel_usuarios.js` | Lógica accordion, modal, debounce, sin contenteditable |
