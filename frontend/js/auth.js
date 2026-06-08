import { API_BASE_URL } from "/config/config.js";

export async function verificarSesion() {
  try {
    const res = await fetch(`${API_BASE_URL}/usuarios/me`);
    if (!res.ok) {
      sessionStorage.removeItem("usuario_id");
      sessionStorage.removeItem("usuario");
      sessionStorage.removeItem("rol");
      return null;
    }
    const data = await res.json();
    sessionStorage.setItem("usuario_id", data.id);
    sessionStorage.setItem("usuario", data.usuario);
    sessionStorage.setItem("rol", data.rol);
    return data;
  } catch {
    return null;
  }
}

export function mostrarBotonesPorRol(rol, nombre) {
  const navbarUser = document.getElementById('navbarUser');
  const navbarAuth = document.getElementById('navbarAuth');

  if (navbarUser) navbarUser.classList.toggle('show', !!rol);
  if (navbarAuth) navbarAuth.style.display = rol ? 'none' : 'flex';

  const usernameDisplay = document.getElementById('usernameDisplay');
  if (usernameDisplay && nombre) usernameDisplay.textContent = nombre;

  const adminItems = document.querySelectorAll(".admin-only, [data-rol='admin']");
  const editorItems = document.querySelectorAll(".editor-only, [data-rol='editor']");
  const supervisorItems = document.querySelectorAll(".supervisor-only, [data-rol='supervisor']");
  const authItems = document.querySelectorAll(".auth-only");
  const guestItems = document.querySelectorAll(".guest-only");

  if (rol) {
    authItems.forEach((el) => (el.style.display = ""));
    guestItems.forEach((el) => (el.style.display = "none"));

    adminItems.forEach((el) => (el.style.display = rol === "admin" ? "" : "none"));
    editorItems.forEach((el) => (el.style.display = ["admin", "supervisor", "editor"].includes(rol) ? "" : "none"));
    supervisorItems.forEach((el) => (el.style.display = ["admin", "supervisor"].includes(rol) ? "" : "none"));
  } else {
    authItems.forEach((el) => (el.style.display = "none"));
    guestItems.forEach((el) => (el.style.display = ""));
    adminItems.forEach((el) => (el.style.display = "none"));
    editorItems.forEach((el) => (el.style.display = "none"));
    supervisorItems.forEach((el) => (el.style.display = "none"));
  }
}

export function guardarSesion(id, usuario, rol) {
  sessionStorage.setItem("usuario_id", id);
  sessionStorage.setItem("usuario", usuario);
  sessionStorage.setItem("rol", rol);
}

export function cerrarSesion() {
  Swal.fire({
    title: "Esta seguro?",
    text: "Desea cerrar sesion?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Si, cerrar sesion",
    cancelButtonText: "Cancelar",
  }).then((result) => {
    if (result.isConfirmed) {
      fetch(`${API_BASE_URL}/auth/logout`, { method: "POST" }).catch(() => {});
      sessionStorage.clear();

      // Reset navbar to guest (logged-out) state
      const navbarUser = document.getElementById('navbarUser');
      const navbarAuth = document.getElementById('navbarAuth');
      if (navbarUser) navbarUser.classList.remove('show');
      if (navbarAuth) navbarAuth.style.display = 'flex';

      Swal.fire({ icon: "success", title: "Sesion cerrada", timer: 2000, showConfirmButton: false })
        .then(() => { window.location.href = "/"; });
    }
  });
}

export function usuarioId() {
  return sessionStorage.getItem("usuario_id");
}

export function usuarioRol() {
  return sessionStorage.getItem("rol");
}

export function usuarioNombre() {
  return sessionStorage.getItem("usuario");
}
