import { API_BASE_URL } from "/config/config.js";

// ──────────────────────────────────────────────
// Session verification
// ──────────────────────────────────────────────
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

// ──────────────────────────────────────────────
// Role-based UI (shared by all pages)
// ──────────────────────────────────────────────
export function mostrarBotonesPorRol(rol, nombre) {
  if (!nombre) nombre = sessionStorage.getItem("usuario");

  // Toggle top-level auth containers
  const navbarUser = document.getElementById("navbarUser");
  const navbarAuth = document.getElementById("navbarAuth");
  if (navbarUser) navbarUser.classList.toggle("show", !!rol);
  if (navbarAuth) navbarAuth.style.display = rol ? "none" : "flex";

  const drawerUser = document.getElementById("drawerUser");
  const drawerAuth = document.getElementById("drawerAuth");
  if (drawerUser) drawerUser.classList.toggle("show", !!rol);
  if (drawerAuth) drawerAuth.style.display = rol ? "none" : "flex";

  // Greeting
  const usernameDisplay = document.getElementById("usernameDisplay");
  if (usernameDisplay && nombre) usernameDisplay.textContent = nombre;

  // Drawer user info
  const drawerUserInfo = document.getElementById("drawerUserInfo");
  const drawerUsername = document.getElementById("drawerUsername");
  if (drawerUsername && nombre) drawerUsername.textContent = nombre;
  if (drawerUserInfo) drawerUserInfo.style.display = rol && nombre ? "flex" : "none";

  // CSS-class-based visibility
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

  // ── ID-based drawer action buttons (absolute paths) ──

  // Reset all buttons — clone & replace to nuke stale listeners
  ["btn-editar", "adminBtn", "supervisorPanelBtn", "publicarBtn"].forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.style.display = "none";
      btn.replaceWith(btn.cloneNode(true));
    }
  });

  if (!rol) return;

  // Perfil — all authenticated
  const perfil = document.getElementById("btn-editar");
  if (perfil) {
    perfil.style.display = "inline-block";
    perfil.addEventListener("click", () => {
      window.location.href = "/editar-usuario/";
    });
  }

  // Admin — only admin
  if (rol === "admin") {
    const admin = document.getElementById("adminBtn");
    if (admin) {
      admin.style.display = "inline-block";
      admin.addEventListener("click", () => {
        window.location.href = "/administrar-usuario/";
      });
    }
  }

  // Editor+ (admin, supervisor, editor) — panel + publicar
  if (["admin", "supervisor", "editor"].includes(rol)) {
    const panel = document.getElementById("supervisorPanelBtn");
    if (panel) {
      panel.style.display = "inline-block";
      panel.addEventListener("click", () => {
        window.location.href = "/administrar-noticia/";
      });
    }
    const pub = document.getElementById("publicarBtn");
    if (pub) {
      pub.style.display = "inline-block";
      pub.addEventListener("click", () => {
        window.location.href = "/crear-noticia/";
      });
    }
  }
}

// ──────────────────────────────────────────────
// Visit count (read-only — no increment)
// ──────────────────────────────────────────────
export async function cargarVisitas() {
  try {
    const res = await fetch(`${API_BASE_URL}/vistas/`, { method: "GET" });
    const data = await res.json();
    const el = document.getElementById("visitorCount");
    if (el) el.textContent = `${data.cantidad} visitas`;
  } catch {
    // silently fail — non-critical
  }
}

// ──────────────────────────────────────────────
// Single-entry navbar init (call once per page)
// ──────────────────────────────────────────────
export function initNavbar(session) {
  if (!session) {
    mostrarBotonesPorRol(null);
    setupDrawer();
    const lo = document.getElementById("logoutBtn");
    if (lo) lo.addEventListener("click", cerrarSesion);
    return;
  }

  // Logged-in containers
  const nu = document.getElementById("navbarUser");
  if (nu) nu.classList.add("show");
  const na = document.getElementById("navbarAuth");
  if (na) na.style.display = "none";
  const du = document.getElementById("drawerUser");
  if (du) du.classList.add("show");
  const da = document.getElementById("drawerAuth");
  if (da) da.style.display = "none";

  // Greeting
  const gr = document.getElementById("navbarGreeting");
  const ud = document.getElementById("usernameDisplay");
  if (ud) ud.textContent = session.usuario;
  if (gr) gr.classList.add("show");

  // Role buttons + drawer username
  mostrarBotonesPorRol(session.rol, session.usuario);

  // Logout
  const lo = document.getElementById("logoutBtn");
  if (lo) lo.addEventListener("click", cerrarSesion);

  // Drawer toggle
  setupDrawer();
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

      // Reset navbar and drawer to guest (logged-out) state
      const navbarUser = document.getElementById('navbarUser');
      const navbarAuth = document.getElementById('navbarAuth');
      if (navbarUser) navbarUser.classList.remove('show');
      if (navbarAuth) navbarAuth.style.display = 'flex';
      const drawerUser = document.getElementById('drawerUser');
      const drawerAuth = document.getElementById('drawerAuth');
      if (drawerUser) drawerUser.classList.remove('show');
      if (drawerAuth) drawerAuth.style.display = 'flex';

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

export function setupDrawer() {
  const hamburger = document.getElementById('hamburgerBtn');
  const drawer = document.getElementById('sideDrawer');
  const overlay = document.getElementById('drawerOverlay');

  if (!hamburger || !drawer || !overlay) return;

  function openDrawer() {
    drawer.classList.add('open');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', () => {
    if (drawer.classList.contains('open')) {
      closeDrawer();
    } else {
      openDrawer();
    }
  });

  overlay.addEventListener('click', closeDrawer);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawer();
  });

  drawer.querySelectorAll('.drawer-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setTimeout(closeDrawer, 150);
    });
  });
}
