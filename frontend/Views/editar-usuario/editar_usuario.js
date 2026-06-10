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

    // Poblar campos del formulario
    document.getElementById("editNombre").value = usuario.nombre || "";
    document.getElementById("editApellido").value = usuario.apellido || "";
    document.getElementById("editUsuario").value = usuario.usuario || "";

    // Actualizar display info
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

    // Avatar iniciales
    updateAvatar(usuario.nombre, usuario.apellido);

    return true;
  } catch (error) {
    console.error("Error en perfil:", error);
    Swal.fire({
      icon: "error",
      title: "Error al cargar perfil",
      text: error.message || "Ocurrió un error al cargar tus datos. Intenta recargar la página.",
      confirmButtonText: "Recargar"
    }).then(() => window.location.reload());
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
  // Revertir a valores originales del display
  const nameParts = (document.getElementById("profileDisplayName").textContent || "").split(" ");
  document.getElementById("editNombre").value = nameParts[0] || "";
  document.getElementById("editApellido").value = nameParts.slice(1).join(" ") || "";
  document.getElementById("editUsuario").value = (document.getElementById("profileDisplayUser").textContent || "").replace("@", "");
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
      // Actualizar display
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
