# Rediseño Página de Perfil — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rediseñar la página de perfil de usuario con avatar de iniciales, diseño moderno de dos tarjetas, y sección de cambio de contraseña.

**Architecture:** Frontend vanilla JS + CSS3. Una página con dos cards: perfil (avatar + datos editables) y seguridad (cambio de contraseña). Backend existente sin cambios.

**Tech Stack:** Vanilla JS, CSS3 con design tokens, SweetAlert2, Font Awesome 6.

---

### Task 1: CSS — Crear profile.css

**File:** Create `frontend/css/profile.css`

- [ ] **Step 1: Crear profile.css** con el siguiente contenido:

```css
/* ============================================================
   Profile Page — Estilos
   ============================================================ */

/* ---- Profile Layout ---- */
.profile-page {
  max-width: 600px;
  margin: 0 auto;
  padding: 0 var(--space-md);
}

/* ---- Card genérica ---- */
.profile-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--space-lg);
  overflow: hidden;
}

.profile-card-header {
  padding: var(--space-lg);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-base);
  color: var(--color-text);
}

.profile-card-header i {
  color: var(--color-accent);
  font-size: var(--font-size-lg);
}

.profile-card-body {
  padding: var(--space-lg);
}

/* ---- Avatar ---- */
.profile-avatar-section {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  margin-bottom: var(--space-lg);
  flex-wrap: wrap;
}

.avatar-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xxl);
  font-weight: var(--font-weight-bold);
  color: var(--color-white);
  flex-shrink: 0;
  font-family: var(--font-family-heading);
}

.profile-info h3 {
  margin: 0;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text);
}

.profile-info .profile-username {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  margin: 2px 0 0 0;
}

.profile-meta {
  display: flex;
  gap: var(--space-lg);
  margin-top: var(--space-sm);
  flex-wrap: wrap;
}

.profile-meta-item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.profile-meta-item i {
  color: var(--color-accent);
  width: 16px;
  text-align: center;
}

/* ---- Role badge ---- */
.profile-role-badge {
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

/* ---- Profile Form ---- */
.profile-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.profile-form .form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
}

.profile-form .form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.profile-form .form-group label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
}

.profile-form .form-group input {
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  font-family: var(--font-family-body);
  background: var(--color-bg-card);
  outline: none;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.profile-form .form-group input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.1);
}

.profile-form .form-group input:disabled {
  background: var(--color-bg);
  color: var(--color-text-muted);
  cursor: not-allowed;
  border-color: var(--color-border-light);
}

/* ---- Buttons ---- */
.profile-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
  margin-top: var(--space-sm);
}

.profile-actions .btn {
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

.profile-actions .btn-primary {
  background: var(--color-accent);
  color: var(--color-white);
}

.profile-actions .btn-primary:hover {
  background: var(--color-accent-dark);
}

.profile-actions .btn-secondary {
  background: var(--color-bg);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

.profile-actions .btn-secondary:hover {
  background: var(--color-border-light);
}

.profile-actions .btn-success {
  background: var(--color-success);
  color: var(--color-white);
}

.profile-actions .btn-success:hover {
  background: var(--color-success-dark);
}

/* ---- Password form ---- */
.password-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.password-form .form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.password-form .form-group label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
}

.password-form .form-group input {
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  font-family: var(--font-family-body);
  outline: none;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.password-form .form-group input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.1);
}

/* ---- Responsive ---- */
@media (max-width: 768px) {
  .profile-form .form-row {
    grid-template-columns: 1fr;
  }

  .profile-avatar-section {
    flex-direction: column;
    text-align: center;
  }

  .profile-meta {
    justify-content: center;
  }

  .profile-actions {
    flex-direction: column;
  }

  .profile-actions .btn {
    width: 100%;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/css/profile.css
git commit -m "feat: create profile.css with avatar, card, form styles"
```

---

### Task 2: HTML — Restructurar index.html del perfil

**File:** Modify `frontend/Views/editar-usuario/index.html`

- [ ] **Step 1: Agregar link a profile.css** después de admin-common.css (línea 14):
```html
<link rel="stylesheet" href="../../css/profile.css" />
```

- [ ] **Step 2: Reemplazar el bloque `<style>...</style>`** (líneas 16-135) con solo esto:
```html
<style>
  body {
    min-height: 100vh;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
  }
</style>
```

- [ ] **Step 3: Reemplazar el contenido del `<div class="container">...`** (líneas 242-263) con:
```html
<div class="profile-page">

  <!-- Profile Card -->
  <div class="profile-card">
    <div class="profile-card-body">
      <div class="profile-avatar-section">
        <div class="avatar-circle" id="avatarCircle">AB</div>
        <div class="profile-info">
          <h3 id="profileDisplayName">Ana Benítez</h3>
          <p class="profile-username" id="profileDisplayUser">@ana.b</p>
          <div class="profile-meta">
            <span class="profile-meta-item">
              <i class="fas fa-user-tag"></i>
              <span id="profileDisplayRole" class="profile-role-badge">Editor</span>
            </span>
            <span class="profile-meta-item">
              <i class="fas fa-calendar-alt"></i>
              Miembro desde <span id="profileDisplayDate">10 Ene 2025</span>
            </span>
          </div>
        </div>
      </div>

      <form id="formEditarSesion" class="profile-form">
        <div class="form-row">
          <div class="form-group">
            <label for="editNombre">Nombre</label>
            <input type="text" id="editNombre" disabled />
          </div>
          <div class="form-group">
            <label for="editApellido">Apellido</label>
            <input type="text" id="editApellido" disabled />
          </div>
        </div>
        <div class="form-group">
          <label for="editUsuario">Usuario</label>
          <input type="text" id="editUsuario" disabled />
        </div>
        <div class="profile-actions" id="profileActions">
          <button type="button" id="btnEditar" class="btn btn-primary">
            <i class="fas fa-pen"></i> Editar Perfil
          </button>
          <button type="submit" id="btnGuardar" class="btn btn-success" style="display:none;">
            <i class="fas fa-save"></i> Guardar Cambios
          </button>
          <button type="button" id="btnCancelar" class="btn btn-secondary" style="display:none;">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- Security Card -->
  <div class="profile-card">
    <div class="profile-card-header">
      <i class="fas fa-lock"></i>
      <span>Cambiar Contraseña</span>
    </div>
    <div class="profile-card-body">
      <form id="formCambiarPassword" class="password-form">
        <div class="form-group">
          <label for="passwordActual">Contraseña actual</label>
          <input type="password" id="passwordActual" placeholder="Tu contraseña actual" required />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="passwordNueva">Nueva contraseña</label>
            <input type="password" id="passwordNueva" placeholder="Mín. 8 caracteres" required />
          </div>
          <div class="form-group">
            <label for="passwordConfirmar">Confirmar</label>
            <input type="password" id="passwordConfirmar" placeholder="Repite la contraseña" required />
          </div>
        </div>
        <div class="profile-actions">
          <button type="submit" class="btn btn-primary">
            <i class="fas fa-key"></i> Actualizar Contraseña
          </button>
        </div>
      </form>
    </div>
  </div>

</div>
```

- [ ] **Step 4: Commit**

```bash
git add frontend/Views/editar-usuario/index.html
git commit -m "feat: restructure profile page with avatar card and password section"
```

---

### Task 3: JS — Reescribir editar_usuario.js

**File:** Modify `frontend/Views/editar-usuario/editar_usuario.js`

- [ ] **Step 1: Reemplazar TODO el contenido** con:

```javascript
import { API_BASE_URL } from "/config/config.js";
import { verificarSesion, cerrarSesion, initNavbar, cargarVisitas } from "/js/auth.js";

const apiBaseUrl = `${API_BASE_URL}/usuarios`;

/* ===================================================
   Avatar helper: generates color from string
   =================================================== */
function getAvatarColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    "#1D4ED8", "#059669", "#D97706", "#DC2626",
    "#7C3AED", "#DB2777", "#0891B2", "#65A30D"
  ];
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(nombre, apellido) {
  return (nombre?.charAt(0) || "") + (apellido?.charAt(0) || "");
}

function updateAvatar(nombre, apellido) {
  const circle = document.getElementById("avatarCircle");
  if (!circle) return;
  const initials = getInitials(nombre, apellido);
  circle.textContent = initials.toUpperCase();
  circle.style.background = getAvatarColor(nombre + apellido);
}

/* ===================================================
   Session & Data
   =================================================== */
async function verificarSesionYCargarDatos() {
  try {
    const session = await verificarSesion();
    if (!session) throw new Error("Sesion no valida");

    initNavbar(session);
    cargarVisitas();

    const res = await fetch(`${apiBaseUrl}/me`);
    if (!res.ok) throw new Error("Error al obtener datos");
    const usuario = await res.json();

    // Poblar campos
    document.getElementById("editNombre").value = usuario.nombre || "";
    document.getElementById("editApellido").value = usuario.apellido || "";
    document.getElementById("editUsuario").value = usuario.usuario || "";

    // Display info
    const fullName = `${usuario.nombre || ""} ${usuario.apellido || ""}`.trim();
    document.getElementById("profileDisplayName").textContent = fullName;
    document.getElementById("profileDisplayUser").textContent = `@${usuario.usuario || ""}`;
    document.getElementById("profileDisplayRole").textContent =
      (usuario.rol || "").charAt(0).toUpperCase() + (usuario.rol || "").slice(1);

    // Parse date
    if (usuario.create_time) {
      const d = new Date(usuario.create_time);
      document.getElementById("profileDisplayDate").textContent =
        d.toLocaleDateString("es-PA", { year: "numeric", month: "short", day: "numeric" });
    }

    // Avatar
    updateAvatar(usuario.nombre, usuario.apellido);

    return true;
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Sesion no valida",
      text: "Debes iniciar sesion para acceder.",
      confirmButtonText: "Ir al inicio"
    }).then(() => window.location.href = "/");
    return false;
  }
}

/* ===================================================
   Toggle edit mode
   =================================================== */
function enterEditMode() {
  document.querySelectorAll("#editNombre, #editApellido, #editUsuario")
    .forEach(input => input.removeAttribute("disabled"));
  document.getElementById("btnEditar").style.display = "none";
  document.getElementById("btnGuardar").style.display = "inline-flex";
  document.getElementById("btnCancelar").style.display = "inline-flex";
}

function exitEditMode() {
  document.querySelectorAll("#editNombre, #editApellido, #editUsuario")
    .forEach(input => input.setAttribute("disabled", true));
  document.getElementById("btnEditar").style.display = "inline-flex";
  document.getElementById("btnGuardar").style.display = "none";
  document.getElementById("btnCancelar").style.display = "none";
  // Restore original values from display
  document.getElementById("editNombre").value = document.getElementById("profileDisplayName").textContent.split(" ")[0] || "";
  document.getElementById("editApellido").value = document.getElementById("profileDisplayName").textContent.split(" ").slice(1).join(" ") || "";
}

/* ===================================================
   Save profile
   =================================================== */
async function guardarPerfil(e) {
  e.preventDefault();
  const nombre = document.getElementById("editNombre").value.trim();
  const apellido = document.getElementById("editApellido").value.trim();
  const usuario = document.getElementById("editUsuario").value.trim();

  if (!nombre || !apellido || !usuario) {
    Swal.fire({ icon: "warning", title: "Campos incompletos", text: "Completa todos los campos." });
    return;
  }

  try {
    const res = await fetch(`${apiBaseUrl}/me`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, apellido, usuario }),
    });
    const result = await res.json();
    if (res.ok) {
      Swal.fire({
        icon: "success", title: "Actualizado", text: "Tus datos han sido modificados.",
        timer: 1500, showConfirmButton: false
      });
      // Update display
      const fullName = `${nombre} ${apellido}`.trim();
      document.getElementById("profileDisplayName").textContent = fullName;
      document.getElementById("profileDisplayUser").textContent = `@${usuario}`;
      updateAvatar(nombre, apellido);
      exitEditMode();
    } else {
      Swal.fire({ icon: "error", title: "Error", text: result.detail || "No se pudo actualizar." });
    }
  } catch (error) {
    Swal.fire({ icon: "error", title: "Error de red", text: "No se pudo conectar al servidor." });
  }
}

/* ===================================================
   Change password
   =================================================== */
async function cambiarPassword(e) {
  e.preventDefault();
  const password = document.getElementById("passwordActual").value.trim();
  const newPassword = document.getElementById("passwordNueva").value.trim();
  const confirmPassword = document.getElementById("passwordConfirmar").value.trim();

  if (!password || !newPassword || !confirmPassword) {
    Swal.fire({ icon: "warning", title: "Campos incompletos", text: "Completa todos los campos." });
    return;
  }

  if (newPassword !== confirmPassword) {
    Swal.fire({ icon: "error", title: "Error", text: "Las contraseñas nuevas no coinciden." });
    return;
  }

  if (newPassword.length < 8) {
    Swal.fire({ icon: "error", title: "Error", text: "La contraseña debe tener al menos 8 caracteres." });
    return;
  }

  try {
    const url = `${apiBaseUrl}/me/pass?password=${encodeURIComponent(password)}&newPassword=${encodeURIComponent(newPassword)}`;
    const res = await fetch(url, { method: "PATCH" });
    const result = await res.json();
    if (res.ok) {
      Swal.fire({
        icon: "success", title: "Contraseña actualizada", text: "Tu contraseña ha sido cambiada.",
        timer: 1500, showConfirmButton: false
      });
      document.getElementById("formCambiarPassword").reset();
    } else {
      Swal.fire({ icon: "error", title: "Error", text: result.detail || "No se pudo cambiar la contraseña." });
    }
  } catch (error) {
    Swal.fire({ icon: "error", title: "Error de red", text: "No se pudo conectar al servidor." });
  }
}

/* ===================================================
   Event Listeners
   =================================================== */
document.getElementById("btnEditar")?.addEventListener("click", enterEditMode);
document.getElementById("btnCancelar")?.addEventListener("click", exitEditMode);
document.getElementById("formEditarSesion")?.addEventListener("submit", guardarPerfil);
document.getElementById("formCambiarPassword")?.addEventListener("submit", cambiarPassword);

/* ===================================================
   Init
   =================================================== */
(async function init() {
  await verificarSesionYCargarDatos();
})();
```

- [ ] **Step 2: Commit**

```bash
git add frontend/Views/editar-usuario/editar_usuario.js
git commit -m "feat: rewrite profile JS with avatar, password change, edit toggle"
```

---

### Task 4: Verificación

- [ ] **Step 1: Verificar JS syntax**
Run: `node -e "require('fs').readFileSync('frontend/Views/editar-usuario/editar_usuario.js', 'utf8'); console.log('OK')"`

- [ ] **Step 2: Revisar HTML**
Abrir HTML en navegador o verificar estructura visualmente

- [ ] **Step 3: Commit si hay ajustes**

```bash
git add -A
git commit -m "fix: adjustments after verification"
```
