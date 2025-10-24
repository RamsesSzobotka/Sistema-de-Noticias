const apiUrl = "http://127.0.0.1:8000/usuarios/";
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
    const res = await fetch("http://127.0.0.1:8000/usuarios/me", {
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
  const rol = "admin";

  const token = sessionStorage.getItem("access_token")?.replaceAll('"', '');

  if (!nombre || !apellido || !usuario || !contrasena) {
    Swal.fire("Error", "Todos los campos son obligatorios.", "error");
    return;
  }

  try {
    const response = await fetch("http://127.0.0.1:8000/auth/admin/register", {
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
// 🔹 Cargar usuarios desde backend
// ==============================
async function cargarUsuarios(page = 1, size = 50) {
  const access_token = sessionStorage.getItem("access_token")?.replaceAll('"', '');
  if (!access_token) return;

  try {
    const res = await fetch(`${apiUrl}?page=${page}&size=${size}`, {
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error("Error al obtener la lista de usuarios");
    }

    const data = await res.json();
    console.log("Usuarios recibidos:", data);

    usuariosCargados = data.usuarios || [];
    renderizarUsuarios(usuariosCargados);
  } catch (error) {
    console.error("Error cargando usuarios:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudieron cargar los usuarios.",
    });
  }
}

// ==============================
// 🔹 Listeners y eventos
// ==============================
document.addEventListener("DOMContentLoaded", verificarSesionYPermiso);

// Buscar usuarios
document.getElementById("buscadorUsuarios").addEventListener("input", e => {
  const palabra = e.target.value.trim().toLowerCase();
  if (!palabra) return renderizarUsuarios(usuariosCargados);

  const filtrados = usuariosCargados.filter(user =>
    user.nombre.toLowerCase().includes(palabra) ||
    user.apellido.toLowerCase().includes(palabra) ||
    user.usuario.toLowerCase().includes(palabra)
  );

  renderizarUsuarios(filtrados);
});

// Filtros
document.getElementById("filtrosUsuarios").addEventListener("click", e => {
  if (e.target.tagName !== "BUTTON") return;
  const filtro = e.target.dataset.filtro;

  let filtrados = [];
  switch (filtro) {
    case "activos":
      filtrados = usuariosCargados.filter(u => u.activo == 1);
      break;
    case "inactivos":
      filtrados = usuariosCargados.filter(u => u.activo == 0);
      break;
    case "supervisor":
      filtrados = usuariosCargados.filter(u => u.rol === "supervisor");
      break;
    case "editor":
      filtrados = usuariosCargados.filter(u => u.rol === "editor");
      break;
    default:
      filtrados = usuariosCargados;
  }

  renderizarUsuarios(filtrados);
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
    const nombre = tr.querySelector('[data-field="nombre"]').innerText.trim();
    const apellido = tr.querySelector('[data-field="apellido"]').innerText.trim();
    const usuario = tr.querySelector('[data-field="usuario"]').innerText.trim();
    const rol = tr.querySelector('[data-field="rol"]').value;

    try {
      const res = await fetch(`${apiUrl}?id=${id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nombre, apellido, usuario, rol }),
      });

      const result = await res.json();

      if (res.ok) {
        Swal.fire("Actualizado", "Usuario modificado correctamente", "success");
        await cargarUsuarios();
      } else {
        Swal.fire("Error", result.detail || "Error al actualizar usuario", "error");
      }
    } catch (error) {
      Swal.fire("Error", "No se pudo conectar con el servidor.", "error");
    }
  }
});
document.getElementById("formAddUser").addEventListener("submit", e => {
  e.preventDefault(); // Evita que se recargue la página
  registrarAdmin();
});
