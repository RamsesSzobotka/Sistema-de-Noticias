import { API_BASE_URL } from "../../config/config.js";
const apiUrl = `${API_BASE_URL}/usuarios/`;
let usuariosCargados = []; // Cache local

// ==============================
// 🔹 Verificar sesión y rol
// ==============================
async function verificarSesionYPermiso() {
  let access_token = sessionStorage.getItem("access_token");

  if (!access_token) {
    Swal.fire({
      icon: "warning",
      title: "Debes iniciar sesión",
      text: "Inicia sesión para acceder a esta sección.",
    }).then(() => {
      window.location.href = "../auth/iniciar-sesion/index.html";
    });
    return;
  }

  access_token = access_token.replaceAll('"', '');

  try {
    const res = await fetch(`${API_BASE_URL}/usuarios/me`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      sessionStorage.clear();
      throw new Error("Token inválido o sesión expirada");
    }

    const data = await res.json();
    console.log("Usuario autenticado:", data);

    sessionStorage.setItem("usuario_id", data.id);
    sessionStorage.setItem("rol", data.rol);
    sessionStorage.setItem("usuario", data.usuario);

    if (data.rol.toLowerCase() !== "admin") {
      Swal.fire({
        icon: "error",
        title: "Acceso denegado",
        text: "No tienes permisos para acceder a esta sección.",
      }).then(() => {
        window.location.href = "../index.html";
      });
      return;
    }

    await cargarUsuarios();
  } catch (error) {
    console.error("Error verificando sesión:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: error.message || "No se pudo verificar la sesión.",
    });
  }
}

// ==============================
// 🔹 Registrar nuevo administrador
// ==============================
async function registrarAdmin() {
  const nombre = document.getElementById("nombre").value.trim();
  const apellido = document.getElementById("apellido").value.trim();
  const usuario = document.getElementById("usuario").value.trim();
  const contrasena = document.getElementById("contrasena").value.trim();
  const rol = document.getElementById("rol").value.trim();

  const token = sessionStorage.getItem("access_token")?.replaceAll('"', '');

  if (!nombre || !apellido || !usuario || !contrasena) {
    Swal.fire("Error", "Todos los campos son obligatorios.", "error");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/admin/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ nombre, apellido, usuario, contrasena, rol }),
    });

    const result = await response.json();

    if (response.ok) {
      Swal.fire("Éxito", result.detail, "success");
      document.getElementById("formAddUser").reset();
      await cargarUsuarios();
    } else {
      Swal.fire("Error", result.detail || "Error al registrar usuario", "error");
    }
  } catch (error) {
    Swal.fire("Error", "No se pudo conectar con el servidor.", "error");
  }
}

// ==============================
// 🔹 Renderizar tabla de usuarios
// ==============================
function renderizarUsuarios(usuarios) {
  const tbody = document.querySelector("#usersTable tbody");
  if (!tbody) {
    console.error("❌ No se encontró el tbody de la tabla #usersTable");
    return;
  }

  tbody.innerHTML = "";
  usuarios.forEach(user => {
    const tr = document.createElement("tr");
    tr.className = user.activo == 1 ? "active" : "inactive";

    tr.innerHTML = `
      <td>${user.id}</td>
      <td contenteditable="true" data-field="nombre" data-id="${user.id}">${user.nombre}</td>
      <td contenteditable="true" data-field="apellido" data-id="${user.id}">${user.apellido}</td>
      <td contenteditable="true" data-field="usuario" data-id="${user.id}">${user.usuario}</td>
      <td>
        <select data-field="rol" data-id="${user.id}">
          <option value="global" ${user.rol === "global" ? "selected" : ""}>Global</option>
          <option value="editor" ${user.rol === "editor" ? "selected" : ""}>Editor</option>
          <option value="admin" ${user.rol === "admin" ? "selected" : ""}>Admin</option>
          <option value="supervisor" ${user.rol === "supervisor" ? "selected" : ""}>Supervisor</option>
        </select>
      </td>
      <td>${user.activo == 1 ? "Sí" : "No"}</td>
      <td>
        <button data-action="toggle" data-id="${user.id}">${user.activo == 1 ? "Desactivar" : "Activar"}</button>
        <button data-action="guardar" data-id="${user.id}">Guardar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ==============================
// 🔹 Cargar usuarios desde backend (con filtros y paginación)
// ==============================
async function cargarUsuarios(filtro = "todos", page = 1, size = 10) {
  const access_token = sessionStorage.getItem("access_token")?.replaceAll('"', '');
  if (!access_token) return;

  Swal.fire({
    title: "Cargando usuarios...",
    text: "Por favor espera un momento.",
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  try {
    const res = await fetch(`${apiUrl}?filtro=${filtro}&page=${page}&size=${size}`, {
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) throw new Error("Error al obtener la lista de usuarios");

    const data = await res.json();
    console.log("Usuarios recibidos:", data);

    usuariosCargados = data.usuarios || [];
    renderizarUsuarios(usuariosCargados);

    // Generar paginación 👇
    generarPaginacionUsuarios(data.total_pages || 1, data.page || page, filtro);

    Swal.close();
  } catch (error) {
    console.error("Error cargando usuarios:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudieron cargar los usuarios.",
    });
  }
}

function generarPaginacionUsuarios(totalPaginas, paginaActual, filtroActual = "todos") {
  const contenedor = document.getElementById("paginacionUsuarios");
  contenedor.innerHTML = "";

  if (totalPaginas < 1) totalPaginas = 1;

  for (let i = 1; i <= totalPaginas; i++) {
    const boton = document.createElement("button");
    boton.textContent = i;
    boton.classList.add("pagina-btn");

    if (i === paginaActual) boton.classList.add("activa");

    boton.addEventListener("click", () => {
      cargarUsuarios(filtroActual, i); // 👈 vuelve a llamar con la página seleccionada
    });

    contenedor.appendChild(boton);
  }
}

// ==============================
// 🔹 Listeners y eventos
// ==============================
document.addEventListener("DOMContentLoaded", verificarSesionYPermiso);

// ==============================
// 🔍 Buscar usuarios en el backend
// ==============================
async function buscarUsuariosBackend(termino) {
  const access_token = sessionStorage.getItem("access_token")?.replaceAll('"', '');
  if (!access_token || !termino.trim()) {
    // Si el campo está vacío, recarga los usuarios normales
    return await cargarUsuarios();
  }

  try {
    const res = await fetch(`${apiUrl}buscar?query=${encodeURIComponent(termino)}`, {
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error("Error al realizar la búsqueda");
    }

    const data = await res.json();

    usuariosCargados = data.usuarios || [];
    renderizarUsuarios(usuariosCargados);
  } catch (error) {
    console.error("Error en búsqueda:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo realizar la búsqueda.",
    });
  }
}

// 🔍 Buscar usuarios (con backend)
document.getElementById("buscadorUsuarios").addEventListener("input", async e => {
  const termino = e.target.value.trim();

  if (!termino) {
    // Si se borra el texto, recarga todos
    await cargarUsuarios();
    return;
  }

  await buscarUsuariosBackend(termino);
});


// ==============================
// 🔹 Filtros: hacen petición al backend
// ==============================
document.getElementById("filtrosUsuarios").addEventListener("click", async e => {
  if (e.target.tagName !== "BUTTON") return;

  const filtroBtn = e.target.dataset.filtro;
  let filtroQuery = "todos";

  switch (filtroBtn) {
    case "activos":
      filtroQuery = "activo";
      break;
    case "inactivos":
      filtroQuery = "inactivo";
      break;
    case "supervisor":
      filtroQuery = "supervisor";
      break;
    case "editor":
      filtroQuery = "editor";
      break;
    case "admin":
      filtroQuery = "admin";
      break;
    default:
      filtroQuery = "todos";
  }

  await cargarUsuarios(filtroQuery);
});

// ==============================
// 🔹 Guardar y activar/desactivar usuarios
// ==============================
document.querySelector("#usersTable tbody").addEventListener("click", async e => {
  const btn = e.target;
  const id = btn.dataset.id;
  const action = btn.dataset.action;
  const tr = btn.closest("tr");
  const token = sessionStorage.getItem("access_token")?.replaceAll('"', '');

  if (!id || !action) return;

  if (action === "toggle") {
    const nuevoEstado = tr.classList.contains("active") ? 0 : 1;

    try {
      const res = await fetch(`${apiUrl}activo/${id}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ activo: nuevoEstado }),
      });

      const result = await res.json();

      if (res.ok) {
        Swal.fire("Éxito", "Estado actualizado correctamente", "success");
        await cargarUsuarios();
      } else {
        Swal.fire("Error", result.detail || "Error al cambiar estado", "error");
      }
    } catch (error) {
      Swal.fire("Error", "No se pudo conectar con el servidor.", "error");
    }
  }

  if (action === "guardar") {
    const id = tr.querySelector("td:first-child").innerText.trim();
    const rol = tr.querySelector('[data-field="rol"]').value;

    try {
      const res = await fetch(`${apiUrl}update/rol?id=${id}&rol=${rol}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      const result = await res.json();

      if (res.ok) {
        Swal.fire("Actualizado", result.detail || "Usuario modificado correctamente", "success");
        await cargarUsuarios();
      } else {
        Swal.fire("Error", result.detail || "Error al actualizar usuario", "error");
      }
    } catch (error) {
      Swal.fire("Error", "No se pudo conectar con el servidor.", "error");
    }
  }
});

// ==============================
// 🔹 Formulario de nuevo admin
// ==============================
document.getElementById("formAddUser").addEventListener("submit", e => {
  e.preventDefault();
  registrarAdmin();
});