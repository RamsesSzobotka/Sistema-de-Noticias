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
