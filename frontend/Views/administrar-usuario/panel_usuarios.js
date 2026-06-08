import { API_BASE_URL } from "/config/config.js";
const apiUrl = `${API_BASE_URL}/usuarios/`;
let usuariosCargados = [];

async function verificarSesionYPermiso() {
  try {
    const res = await fetch(`${API_BASE_URL}/usuarios/me`);
    if (!res.ok) throw new Error("Token invalido o sesion expirada");
    const data = await res.json();
    sessionStorage.setItem("usuario_id", data.id);
    sessionStorage.setItem("rol", data.rol);
    sessionStorage.setItem("usuario", data.usuario);
    if (data.rol.toLowerCase() !== "admin") {
      Swal.fire({ icon: "error", title: "Acceso denegado", text: "No tienes permisos para acceder a esta seccion." })
        .then(() => window.location.href = "../index.html");
      return;
    }
    await cargarUsuarios();
  } catch (error) {
    Swal.fire({ icon: "error", title: "Error", text: error.message || "No se pudo verificar la sesion." });
  }
}

async function registrarAdmin() {
  const nombre = document.getElementById("nombre").value.trim();
  const apellido = document.getElementById("apellido").value.trim();
  const usuario = document.getElementById("usuario").value.trim();
  const contrasena = document.getElementById("contrasena").value.trim();
  const rol = document.getElementById("rol").value.trim();
  if (!nombre || !apellido || !usuario || !contrasena) {
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
      await cargarUsuarios();
    } else {
      Swal.fire("Error", result.detail || "Error al registrar usuario", "error");
    }
  } catch (error) {
    Swal.fire("Error", "No se pudo conectar con el servidor.", "error");
  }
}

function renderizarUsuarios(usuarios) {
  const tbody = document.querySelector("#usersTable tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  usuarios.forEach(user => {
    const tr = document.createElement("tr");
    tr.className = user.activo == 1 ? "active" : "inactive";

    function addCell(text) {
      const td = document.createElement("td");
      td.textContent = text;
      return td;
    }

    tr.appendChild(addCell(user.id));

    const tdNombre = document.createElement("td");
    tdNombre.contentEditable = true;
    tdNombre.dataset.field = "nombre";
    tdNombre.dataset.id = user.id;
    tdNombre.textContent = user.nombre;
    tr.appendChild(tdNombre);

    const tdApellido = document.createElement("td");
    tdApellido.contentEditable = true;
    tdApellido.dataset.field = "apellido";
    tdApellido.dataset.id = user.id;
    tdApellido.textContent = user.apellido;
    tr.appendChild(tdApellido);

    const tdUsuario = document.createElement("td");
    tdUsuario.contentEditable = true;
    tdUsuario.dataset.field = "usuario";
    tdUsuario.dataset.id = user.id;
    tdUsuario.textContent = user.usuario;
    tr.appendChild(tdUsuario);

    const tdRol = document.createElement("td");
    const select = document.createElement("select");
    select.dataset.field = "rol";
    select.dataset.id = user.id;
    ["global", "editor", "admin", "supervisor"].forEach(r => {
      const opt = document.createElement("option");
      opt.value = r;
      opt.textContent = r.charAt(0).toUpperCase() + r.slice(1);
      if (user.rol === r) opt.selected = true;
      select.appendChild(opt);
    });
    tdRol.appendChild(select);
    tr.appendChild(tdRol);

    tr.appendChild(addCell(user.activo == 1 ? "Si" : "No"));

    const tdAcciones = document.createElement("td");
    const btnToggle = document.createElement("button");
    btnToggle.dataset.action = "toggle";
    btnToggle.dataset.id = user.id;
    btnToggle.textContent = user.activo == 1 ? "Desactivar" : "Activar";
    tdAcciones.appendChild(btnToggle);

    const btnGuardar = document.createElement("button");
    btnGuardar.dataset.action = "guardar";
    btnGuardar.dataset.id = user.id;
    btnGuardar.textContent = "Guardar";
    tdAcciones.appendChild(btnGuardar);

    tr.appendChild(tdAcciones);
    tbody.appendChild(tr);
  });
}

async function cargarUsuarios(filtro = "todos", page = 1, size = 10) {
  Swal.fire({ title: "Cargando usuarios...", text: "Por favor espera.", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
  try {
    const res = await fetch(`${apiUrl}?filtro=${filtro}&page=${page}&size=${size}`);
    if (!res.ok) throw new Error("Error al obtener la lista de usuarios");
    const data = await res.json();
    usuariosCargados = data.usuarios || [];
    renderizarUsuarios(usuariosCargados);
    generarPaginacionUsuarios(data.total_pages || 1, data.page || page, filtro);
    Swal.close();
  } catch (error) {
    Swal.close();
    Swal.fire({ icon: "error", title: "Error", text: "No se pudieron cargar los usuarios." });
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
    boton.addEventListener("click", () => cargarUsuarios(filtroActual, i));
    contenedor.appendChild(boton);
  }
}

document.addEventListener("DOMContentLoaded", verificarSesionYPermiso);

async function buscarUsuariosBackend(termino) {
  if (!termino.trim()) return await cargarUsuarios();
  try {
    const res = await fetch(`${apiUrl}buscar?query=${encodeURIComponent(termino)}`);
    if (!res.ok) throw new Error("Error al realizar la busqueda");
    const data = await res.json();
    usuariosCargados = data.usuarios || [];
    renderizarUsuarios(usuariosCargados);
  } catch (error) {
    Swal.fire({ icon: "error", title: "Error", text: "No se pudo realizar la busqueda." });
  }
}

document.getElementById("buscadorUsuarios").addEventListener("input", async e => {
  const termino = e.target.value.trim();
  if (!termino) { await cargarUsuarios(); return; }
  await buscarUsuariosBackend(termino);
});

document.getElementById("filtrosUsuarios").addEventListener("click", async e => {
  if (e.target.tagName !== "BUTTON") return;
  const map = { activos: "activo", inactivos: "inactivo", supervisor: "supervisor", editor: "editor", admin: "admin" };
  await cargarUsuarios(map[e.target.dataset.filtro] || "todos");
});

document.querySelector("#usersTable tbody").addEventListener("click", async e => {
  const btn = e.target;
  const id = btn.dataset.id;
  const action = btn.dataset.action;
  const tr = btn.closest("tr");
  if (!id || !action) return;

  if (action === "toggle") {
    try {
      const res = await fetch(`${apiUrl}activo/${id}`, { method: "PATCH" });
      const result = await res.json();
      if (res.ok) { Swal.fire("Exito", "Estado actualizado correctamente", "success"); await cargarUsuarios(); }
      else { Swal.fire("Error", result.detail || "Error al cambiar estado", "error"); }
    } catch (error) {
      Swal.fire("Error", "No se pudo conectar con el servidor.", "error");
    }
  }

  if (action === "guardar") {
    const id = tr.querySelector("td:first-child").innerText.trim();
    const rol = tr.querySelector('[data-field="rol"]').value;
    try {
      const res = await fetch(`${apiUrl}update/rol?id=${id}&rol=${rol}`, { method: "PATCH" });
      const result = await res.json();
      if (res.ok) { Swal.fire("Actualizado", result.detail || "Usuario modificado correctamente", "success"); await cargarUsuarios(); }
      else { Swal.fire("Error", result.detail || "Error al actualizar usuario", "error"); }
    } catch (error) {
      Swal.fire("Error", "No se pudo conectar con el servidor.", "error");
    }
  }
});

document.getElementById("formAddUser").addEventListener("submit", e => {
  e.preventDefault();
  registrarAdmin();
});
