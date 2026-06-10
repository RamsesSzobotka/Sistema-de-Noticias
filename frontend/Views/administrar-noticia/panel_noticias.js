import { API_BASE_URL } from "/config/config.js";
import { verificarSesion, cerrarSesion, initNavbar, cargarVisitas } from "/js/auth.js";

let noticiasCargadas = [];
let rolUsuario = "";

document.addEventListener("DOMContentLoaded", async () => {
  const session = await verificarSesion();
  if (session && ["supervisor", "admin", "editor"].includes(session.rol)) {
    rolUsuario = session.rol;

    initNavbar(session);
    cargarVisitas();

    cargarNoticias();
  } else {
    Swal.fire({ icon: "error", title: "Acceso denegado", text: "Acceso denegado. Rol insuficiente." })
      .then(() => window.location.href = "/auth/iniciar-sesion/");
    return;
  }

  document.getElementById("btnMostrarTodas").addEventListener("click", () => {
    activarFiltro("todas");
    cargarNoticias(1, "todas");
  });
  document.getElementById("btnFiltrarActivas").addEventListener("click", () => {
    activarFiltro("activa");
    cargarNoticias(1, "activa");
  });
  document.getElementById("btnFiltrarInactivas").addEventListener("click", () => {
    activarFiltro("inactiva");
    cargarNoticias(1, "inactiva");
  });
});

function activarFiltro(filtro) {
  document.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
  if (filtro === "todas") document.getElementById("btnMostrarTodas").classList.add("active");
  else if (filtro === "activa") document.getElementById("btnFiltrarActivas").classList.add("active");
  else if (filtro === "inactiva") document.getElementById("btnFiltrarInactivas").classList.add("active");
}

function cargarNoticias(pagina = 1, filtro = "todas") {
  const tbody = document.querySelector("#noticiasTable tbody");
  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="7"><div class="spinner"></div></td></tr>';
  }
  const endpoint = `${API_BASE_URL}/noticia/all?filtro=${filtro}&page=${pagina}&size=10`;
  fetch(endpoint)
    .then(res => res.json())
    .then(data => {
      noticiasCargadas = data.noticias || [];
      mostrarNoticias(noticiasCargadas);
      generarPaginacion(data.total_pages || 1, pagina, filtro);
      actualizarStats(noticiasCargadas);
      const tableContainer = document.querySelector(".table-container");
      if (tableContainer) tableContainer.style.display = "block";
    })
    .catch(() => Swal.fire({ icon: "error", title: "Error", text: "No se pudieron cargar las noticias." }));
}

function actualizarStats(noticias) {
  const total = noticias.length;
  const activas = noticias.filter(n => n.activo).length;
  const inactivas = total - activas;
  document.getElementById("totalCount").textContent = total;
  document.getElementById("activeCount").textContent = activas;
  document.getElementById("inactiveCount").textContent = inactivas;
  const header = document.querySelector(".admin-header");
  if (header) header.style.display = "flex";
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
    td.colSpan = 7;
    td.style.cssText = "text-align:center;font-weight:bold;padding:20px;";
    td.textContent = "No hay noticias disponibles.";
    filaVacia.appendChild(td);
    tbody.appendChild(filaVacia);
    return;
  }

  noticias.forEach(noticia => {
    const tr = document.createElement("tr");

    // --- ID ---
    const tdId = document.createElement("td");
    tdId.textContent = noticia.id;
    tdId.setAttribute("data-label", "ID");
    tr.appendChild(tdId);

    // --- Título (bold title + clickable preview) ---
    const tdTitulo = document.createElement("td");
    tdTitulo.setAttribute("data-label", "Título");
    const tituloStrong = document.createElement("strong");
    tituloStrong.textContent = noticia.titulo;
    tdTitulo.appendChild(tituloStrong);
    const preview = document.createElement("div");
    preview.className = "content-cell";
    preview.textContent = (noticia.contenido || "").slice(0, 80) + (noticia.contenido && noticia.contenido.length > 80 ? "..." : "");
    preview.dataset.contenido = noticia.contenido;
    preview.addEventListener("click", (e) => {
      e.stopPropagation();
      mostrarContenidoModal(noticia.contenido);
    });
    tdTitulo.appendChild(preview);
    tr.appendChild(tdTitulo);

    // --- Categoría (badge) ---
    const tdCategoria = document.createElement("td");
    tdCategoria.setAttribute("data-label", "Categoría");
    const catBadge = document.createElement("span");
    catBadge.className = "category-badge-inline";
    catBadge.textContent = noticia.categoria?.nombre || "Sin categoría";
    tdCategoria.appendChild(catBadge);
    tr.appendChild(tdCategoria);

    // --- Autor ---
    const tdAutor = document.createElement("td");
    tdAutor.textContent = noticia.autor;
    tdAutor.setAttribute("data-label", "Autor");
    tr.appendChild(tdAutor);

    // --- Estado (status-badge with dot) ---
    const tdEstado = document.createElement("td");
    tdEstado.setAttribute("data-label", "Estado");
    const badge = document.createElement("span");
    badge.className = `status-badge ${noticia.activo ? "active" : "inactive"}`;
    badge.innerHTML = `<i class="fas fa-circle"></i> ${noticia.activo ? "Activa" : "Inactiva"}`;
    tdEstado.appendChild(badge);
    tr.appendChild(tdEstado);

    // --- Fecha ---
    const tdFecha = document.createElement("td");
    tdFecha.textContent = noticia.fecha_creacion;
    tdFecha.setAttribute("data-label", "Fecha");
    tr.appendChild(tdFecha);

    // --- Acciones (action-buttons with btn-icon) ---
    const tdAcciones = document.createElement("td");
    tdAcciones.setAttribute("data-label", "Acciones");
    const btnGroup = document.createElement("div");
    btnGroup.className = "action-buttons";

    // Toggle button
    const btnToggle = document.createElement("button");
    btnToggle.className = "btn-icon btn-toggle";
    btnToggle.innerHTML = noticia.activo
      ? '<i class="fas fa-toggle-on"></i> Desactivar'
      : '<i class="fas fa-toggle-off"></i> Activar';
    btnToggle.title = noticia.activo ? "Desactivar noticia" : "Activar noticia";
    btnToggle.addEventListener("click", () => actualizarEstado(noticia.id));
    btnGroup.appendChild(btnToggle);

    // Edit button
    const btnEditar = document.createElement("button");
    btnEditar.className = "btn-icon btn-edit";
    btnEditar.innerHTML = '<i class="fas fa-edit"></i> Editar';
    btnEditar.title = "Editar noticia";
    btnEditar.addEventListener("click", () => window.location.href = `/editar-noticia/?id=${noticia.id}`);
    btnGroup.appendChild(btnEditar);

    // Delete button
    const btnEliminar = document.createElement("button");
    btnEliminar.className = "btn-icon btn-delete";
    btnEliminar.innerHTML = '<i class="fas fa-trash"></i> Eliminar';
    btnEliminar.title = "Eliminar noticia";
    btnEliminar.addEventListener("click", () => confirmarEliminacion(noticia.id));
    btnGroup.appendChild(btnEliminar);

    // Image button
    const btnImg = document.createElement("button");
    btnImg.className = "btn-icon btn-image";
    btnImg.innerHTML = '<i class="fas fa-image"></i>';
    btnImg.title = "Ver imagen";
    const placeholderSVG = 'data:image/svg+xml,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">' +
      '<rect fill="#F3F4F6" width="800" height="450"/>' +
      '<text fill="#9CA3AF" font-family="Arial,sans-serif" font-size="18" text-anchor="middle" x="400" y="210">Sin imagen disponible</text>' +
      '<text fill="#D1D5DB" font-family="Arial,sans-serif" font-size="13" text-anchor="middle" x="400" y="240">La imagen no pudo cargarse</text>' +
      '</svg>'
    );
    const imgSrc = noticia.imagenes?.[0]?.imagen
      ? `${API_BASE_URL}/${noticia.imagenes[0].imagen}`
      : placeholderSVG;
    btnImg.addEventListener("click", () => mostrarImagenModal(imgSrc));
    btnGroup.appendChild(btnImg);

    tdAcciones.appendChild(btnGroup);
    tr.appendChild(tdAcciones);

    tbody.appendChild(tr);
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

/* ---- Modal functions (overlay pattern) ---- */

function mostrarImagenModal(src) {
  const img = document.getElementById("imagenGrande");
  const placeholderSVG = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">' +
    '<rect fill="#F3F4F6" width="800" height="450"/>' +
    '<text fill="#9CA3AF" font-family="Arial,sans-serif" font-size="18" text-anchor="middle" x="400" y="210">Sin imagen disponible</text>' +
    '<text fill="#D1D5DB" font-family="Arial,sans-serif" font-size="13" text-anchor="middle" x="400" y="240">La imagen no pudo cargarse</text>' +
    '</svg>'
  );
  img.src = src;
  img.onerror = function () { this.src = placeholderSVG; };
  document.getElementById("modalImagen").classList.add("open");
}

function mostrarContenidoModal(contenido) {
  document.getElementById("textoCompleto").textContent = contenido;
  document.getElementById("modalContenido").classList.add("open");
}

document.getElementById("cerrarModal").addEventListener("click", () => {
  document.getElementById("modalImagen").classList.remove("open");
});
document.getElementById("modalImagen").addEventListener("click", e => {
  if (e.target.id === "modalImagen") e.currentTarget.classList.remove("open");
});

document.getElementById("cerrarModalContenido").addEventListener("click", () => {
  document.getElementById("modalContenido").classList.remove("open");
});
document.getElementById("modalContenido").addEventListener("click", e => {
  if (e.target.id === "modalContenido") e.currentTarget.classList.remove("open");
});

/* ---- Search ---- */

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
