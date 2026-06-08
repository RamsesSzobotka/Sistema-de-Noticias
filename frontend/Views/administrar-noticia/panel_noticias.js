import { API_BASE_URL } from "/config/config.js";

document.addEventListener("DOMContentLoaded", () => {
  verificarSesion();
  document.getElementById("btnMostrarTodas").addEventListener("click", () => cargarNoticias(1, "todas"));
  document.getElementById("btnFiltrarActivas").addEventListener("click", () => cargarNoticias(1, "activa"));
  document.getElementById("btnFiltrarInactivas").addEventListener("click", () => cargarNoticias(1, "inactiva"));
});

let noticiasCargadas = [];
let rolUsuario = "";

function verificarSesion() {
  fetch(`${API_BASE_URL}/usuarios/me`)
    .then(res => {
      if (!res.ok) throw new Error("No autorizado");
      return res.json();
    })
    .then(data => {
      if (["supervisor", "admin", "editor"].includes(data.rol)) {
        rolUsuario = data.rol;
        cargarNoticias();
      } else {
        redirigir("Acceso denegado. Rol insuficiente.");
      }
    })
    .catch(() => redirigir("Error al verificar sesion."));
}

function redirigir(mensaje) {
  Swal.fire({ icon: "error", title: "Acceso denegado", text: mensaje })
    .then(() => window.location.href = "../auth/iniciar-sesion/index.html");
}

function cargarNoticias(pagina = 1, filtro = "todas") {
  const endpoint = `${API_BASE_URL}/noticia/all?filtro=${filtro}&page=${pagina}&size=10`;
  fetch(endpoint)
    .then(res => res.json())
    .then(data => {
      noticiasCargadas = data.noticias || [];
      mostrarNoticias(noticiasCargadas);
      generarPaginacion(data.total_pages || 1, pagina, filtro);
    })
    .catch(() => Swal.fire({ icon: "error", title: "Error", text: "No se pudieron cargar las noticias." }));
}

function generarPaginacion(totalPaginas, paginaActual, filtro = "todas") {
  const contenedor = document.getElementById("paginacion");
  contenedor.innerHTML = "";
  for (let i = 1; i <= totalPaginas; i++) {
    const boton = document.createElement("button");
    boton.textContent = i;
    boton.classList.add("pagina-btn");
    if (i === paginaActual) boton.classList.add("activa");
    boton.addEventListener("click", () => cargarNoticias(i, filtro));
    contenedor.appendChild(boton);
  }
}

function mostrarNoticias(noticias) {
  const tbody = document.querySelector("#noticiasTable tbody");
  tbody.innerHTML = "";

  if (!noticias || noticias.length === 0) {
    const filaVacia = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 10;
    td.style.cssText = "text-align:center;font-weight:bold;padding:20px;";
    td.textContent = "No hay noticias disponibles.";
    filaVacia.appendChild(td);
    tbody.appendChild(filaVacia);
    return;
  }

  noticias.forEach(noticia => {
    const tr = document.createElement("tr");

    function addCell(text) {
      const td = document.createElement("td");
      td.textContent = text;
      return td;
    }

    tr.appendChild(addCell(noticia.id));

    const tdTitulo = document.createElement("td");
    tdTitulo.textContent = noticia.titulo;
    tr.appendChild(tdTitulo);

    const tdContenido = document.createElement("td");
    tdContenido.className = "contenido-celda";
    tdContenido.dataset.contenido = noticia.contenido;
    tdContenido.textContent = (noticia.contenido || "").slice(0, 100) + "...";
    tr.appendChild(tdContenido);

    tr.appendChild(addCell(noticia.categoria?.nombre || "Sin categoria"));
    tr.appendChild(addCell(noticia.autor));

    const tdImg = document.createElement("td");
    tdImg.className = "imagenes-container";
    if (noticia.imagenes) {
      noticia.imagenes.forEach(obj => {
        const img = document.createElement("img");
        img.className = "imagen-noticia";
        img.src = `${API_BASE_URL}/${obj.imagen}`;
        img.alt = "Imagen noticia";
        img.style.cursor = "pointer";
        img.onerror = function () { this.src = "/static/imagenesdb/default.png"; };
        img.addEventListener("click", () => mostrarImagenModal(img.src));
        tdImg.appendChild(img);
      });
    }
    tr.appendChild(tdImg);

    tr.appendChild(addCell(noticia.fecha_creacion));
    tr.appendChild(addCell(noticia.activo ? "Activa" : "Inactiva"));

    const tdAcciones = document.createElement("td");

    const btnEstado = document.createElement("button");
    btnEstado.className = "btn-estado";
    btnEstado.dataset.id = noticia.id;
    btnEstado.textContent = noticia.activo ? "Desactivar" : "Activar";
    tdAcciones.appendChild(btnEstado);

    const btnEditar = document.createElement("button");
    btnEditar.className = "btn-editar";
    btnEditar.dataset.id = noticia.id;
    btnEditar.textContent = "Editar";
    tdAcciones.appendChild(btnEditar);

    const btnEliminar = document.createElement("button");
    btnEliminar.className = "btn-eliminar";
    btnEliminar.dataset.id = noticia.id;
    btnEliminar.textContent = "Eliminar";
    tdAcciones.appendChild(btnEliminar);

    tr.appendChild(tdAcciones);
    tbody.appendChild(tr);
  });

  document.querySelectorAll(".btn-estado").forEach(btn => {
    btn.addEventListener("click", () => actualizarEstado(btn.dataset.id));
  });
  document.querySelectorAll(".btn-editar").forEach(btn => {
    btn.addEventListener("click", () => window.location.href = `../editar-noticia/index.html?id=${btn.dataset.id}`);
  });
  document.querySelectorAll(".btn-eliminar").forEach(btn => {
    btn.addEventListener("click", () => confirmarEliminacion(btn.dataset.id));
  });
}

function confirmarEliminacion(id) {
  Swal.fire({
    title: "Eliminar noticia?", text: "Esta accion no se puede deshacer.", icon: "warning",
    showCancelButton: true, confirmButtonColor: "#d33", cancelButtonColor: "#3085d6",
    confirmButtonText: "Si, eliminar", cancelButtonText: "Cancelar"
  }).then(result => { if (result.isConfirmed) eliminarNoticia(id); });
}

function eliminarNoticia(id) {
  fetch(`${API_BASE_URL}/noticia/?id=${id}`, { method: "DELETE" })
    .then(res => {
      if (!res.ok) return res.json().then(err => { throw new Error(err.detail || "Error al eliminar."); });
      return res.json();
    })
    .then(data => { Swal.fire({ icon: "success", title: "Eliminada", text: data.detail }); cargarNoticias(); })
    .catch(err => Swal.fire({ icon: "error", title: "Error", text: err.message || "No se pudo eliminar." }));
}

function actualizarEstado(id) {
  fetch(`${API_BASE_URL}/noticia/activo/${id}`, { method: "PATCH" })
    .then(res => res.json())
    .then(data => { Swal.fire({ icon: "success", title: "Actualizado", text: data.detail }); cargarNoticias(); })
    .catch(() => Swal.fire({ icon: "error", title: "Error", text: "No se pudo actualizar el estado." }));
}

function mostrarImagenModal(src) {
  document.getElementById("imagenGrande").src = src;
  document.getElementById("modalImagen").style.display = "flex";
}

document.getElementById("cerrarModal").addEventListener("click", () => {
  document.getElementById("modalImagen").style.display = "none";
});

document.getElementById("modalImagen").addEventListener("click", e => {
  if (e.target.id === "modalImagen") e.currentTarget.style.display = "none";
});

function mostrarContenidoModal(contenido) {
  document.getElementById("textoCompleto").textContent = contenido;
  document.getElementById("modalContenido").style.display = "flex";
}

document.getElementById("cerrarModalContenido").addEventListener("click", () => {
  document.getElementById("modalContenido").style.display = "none";
});

document.getElementById("modalContenido").addEventListener("click", e => {
  if (e.target.id === "modalContenido") e.currentTarget.style.display = "none";
});

document.addEventListener("click", e => {
  if (e.target.classList.contains("contenido-celda")) {
    mostrarContenidoModal(e.target.dataset.contenido);
  }
});

const buscador = document.getElementById("buscadorNoticias");
let temporizadorBusqueda = null;

buscador.addEventListener("input", () => {
  clearTimeout(temporizadorBusqueda);
  const texto = buscador.value.trim();
  if (texto === "") { cargarNoticias(1); return; }
  temporizadorBusqueda = setTimeout(() => buscarNoticias(texto), 500);
});

buscador.addEventListener("keypress", e => {
  if (e.key === "Enter") {
    e.preventDefault();
    const texto = buscador.value.trim();
    if (texto !== "") buscarNoticias(texto);
  }
});

function buscarNoticias(texto, pagina = 1) {
  const url = `${API_BASE_URL}/noticia/buscar/admin?query=${encodeURIComponent(texto)}&page=${pagina}&size=10`;
  fetch(url)
    .then(res => { if (!res.ok) throw new Error("Error al buscar"); return res.json(); })
    .then(data => {
      if (!data.noticias || data.noticias.length === 0) { mostrarNoticias([]); return; }
      noticiasCargadas = data.noticias;
      mostrarNoticias(noticiasCargadas);
      generarPaginacion(data.total_pages || 1, pagina);
      document.getElementById("paginacion").querySelectorAll(".pagina-btn").forEach(btn => {
        btn.addEventListener("click", () => buscarNoticias(texto, parseInt(btn.textContent)));
      });
    })
    .catch(err => Swal.fire({ icon: "error", title: "Error en busqueda", text: err.message }));
}
