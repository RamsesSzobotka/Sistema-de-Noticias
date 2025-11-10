document.addEventListener("DOMContentLoaded", () => {
  verificarSesion();
});

let noticiasCargadas = [];
let rolUsuario = "";

// Verifica sesión con el token JWT
function verificarSesion() {
  const token = sessionStorage.getItem("access_token");
  if (!token) {
    return redirigir("No hay sesión activa.");
  }

  fetch("http://localhost:8000/usuarios/me", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  })
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
    .catch(() => {
      redirigir("Error al verificar sesión.");
    });
}

// Redirige al login con alerta
function redirigir(mensaje) {
  Swal.fire({
    icon: "error",
    title: "Acceso denegado",
    text: mensaje
  }).then(() => {
    window.location.href = "../auth/iniciar-sesion/index.html";
  });
}

// Cargar noticias según el rol
// Cargar noticias según el rol
function cargarNoticias(pagina = 1) {
  const token = sessionStorage.getItem("access_token");
  const endpoint = `http://localhost:8000/noticia/all?page=${pagina}&size=10`;

  fetch(endpoint, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  })
    .then(res => res.json())
    .then(data => {
      console.log(data)
      noticiasCargadas = data.noticias || [];
      mostrarNoticias(noticiasCargadas);
      generarPaginacion(data.total_pages || 1, pagina);
    })
    .catch(() => {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar las noticias."
      });
    });
}

// Crear botones de paginación
function generarPaginacion(totalPaginas, paginaActual) {
  const contenedor = document.getElementById("paginacion");
  contenedor.innerHTML = "";

  if (totalPaginas <= 1) return; // no mostrar si solo hay una página

  for (let i = 1; i <= totalPaginas; i++) {
    const boton = document.createElement("button");
    boton.textContent = i;
    boton.classList.add("pagina-btn");
    if (i === paginaActual) boton.classList.add("activa");

    boton.addEventListener("click", () => {
      cargarNoticias(i);
    });

    contenedor.appendChild(boton);
  }
}

// Mostrar noticias en la tabla
function mostrarNoticias(noticias) {
  const tbody = document.querySelector("#noticiasTable tbody");
  tbody.innerHTML = "";

  if (!noticias || noticias.length === 0) {
    const filaVacia = document.createElement("tr");
    filaVacia.innerHTML = `
      <td colspan="10" style="text-align: center; font-weight: bold; padding: 20px;">
        No hay noticias disponibles.
      </td>
    `;
    tbody.appendChild(filaVacia);
    return;
  }

  noticias.forEach(noticia => {
    const fila = document.createElement("tr");

    // Estado textual
    const estadoTexto = noticia.activo ? "Activa" : "Inactiva";

    fila.innerHTML = `
      <td>${noticia.id}</td>
      <td>${noticia.titulo}</td>
      <td class="contenido-celda" data-contenido="${noticia.contenido.replace(/"/g, '&quot;')}">
        ${noticia.contenido.slice(0, 100)}...
      </td>
      <td>${noticia.categoria?.nombre || "Sin categoría"}</td>
      <td>${noticia.autor}</td>
      <td class="imagenes-container">
        ${(noticia.imagenes || [])
          .map(
            obj =>
              `<img src="http://localhost:8000/${obj.imagen}" alt="Imagen noticia" class="imagen-noticia"
                style="cursor: pointer;" onclick="mostrarImagenModal(this.src)"
                onerror="this.src='/imagenesdb/default.png'; this.onerror=null;">`
          )
          .join("")}
      </td>
      <td>${noticia.fecha_creacion}</td>
      <td>${estadoTexto}</td> <!-- ✅ Estado visible -->
      <td>
        <button class="btn-estado" data-id="${noticia.id}">
          ${noticia.activo ? "Desactivar" : "Activar"}
        </button>
        <button class="btn-editar" data-id="${noticia.id}">Editar</button>
        <button class="btn-eliminar" data-id="${noticia.id}">Eliminar</button>
      </td>
    `;
    tbody.appendChild(fila);
  });

  // Botón activar/desactivar
  document.querySelectorAll(".btn-estado").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      actualizarEstado(id);
    });
  });

  // Botón editar
  document.querySelectorAll(".btn-editar").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      window.location.href = `../editar-noticia/index.html?id=${id}`;
    });
  });

  // Botón eliminar
  document.querySelectorAll(".btn-eliminar").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      confirmarEliminacion(id);
    });
  });
}

// Confirmar eliminación
function confirmarEliminacion(id) {
  Swal.fire({
    title: "¿Eliminar noticia?",
    text: "Esta acción no se puede deshacer.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar"
  }).then((result) => {
    if (result.isConfirmed) {
      eliminarNoticia(id);
    }
  });
}

// DELETE noticia
function eliminarNoticia(id) {
  const token = sessionStorage.getItem("access_token");

  fetch(`http://localhost:8000/noticia/?id=${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  })
    .then(res => {
      if (!res.ok) {
        return res.json().then(err => { throw new Error(err.detail || "Error al eliminar."); });
      }
      return res.json();
    })
    .then(data => {
      Swal.fire({
        icon: "success",
        title: "Eliminada",
        text: data.detail
      });
      cargarNoticias();
    })
    .catch(err => {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "No se pudo eliminar la noticia."
      });
    });
}

// PATCH estado (activar/desactivar)
function actualizarEstado(id) {
  const token = sessionStorage.getItem("access_token");

  fetch(`http://localhost:8000/noticia/activo/${id}`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  })
    .then(res => res.json())
    .then(data => {
      Swal.fire({
        icon: "success",
        title: "Actualizado",
        text: data.detail
      });
      cargarNoticias(); // recarga para reflejar cambio
    })
    .catch(() => {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo actualizar el estado."
      });
    });
}

// 🖼️ Mostrar imagen en modal
function mostrarImagenModal(src) {
  const modal = document.getElementById("modalImagen");
  const imagenGrande = document.getElementById("imagenGrande");

  imagenGrande.src = src;
  modal.style.display = "flex"; // se muestra el modal
}

// Cerrar modal de imagen
document.getElementById("cerrarModal").addEventListener("click", () => {
  document.getElementById("modalImagen").style.display = "none";
});

// Cerrar modal si se hace clic fuera de la imagen
document.getElementById("modalImagen").addEventListener("click", (e) => {
  if (e.target.id === "modalImagen") {
    e.currentTarget.style.display = "none";
  }
});

// 🧾 Mostrar contenido completo en modal de texto
function mostrarContenidoModal(contenido) {
  const modal = document.getElementById("modalContenido");
  const texto = document.getElementById("textoCompleto");

  texto.textContent = contenido;
  modal.style.display = "flex";
}

// Cerrar modal de contenido
document.getElementById("cerrarModalContenido").addEventListener("click", () => {
  document.getElementById("modalContenido").style.display = "none";
});

// Cerrar modal si se hace clic fuera del cuadro de texto
document.getElementById("modalContenido").addEventListener("click", (e) => {
  if (e.target.id === "modalContenido") {
    e.currentTarget.style.display = "none";
  }
});

// 🧩 Asignar evento a las celdas de contenido (para ver texto completo)
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("contenido-celda")) {
    const contenido = e.target.dataset.contenido;
    mostrarContenidoModal(contenido);
  }
});

// 🔍 --- BÚSQUEDA DE NOTICIAS ---
const buscador = document.getElementById("buscadorNoticias");
let temporizadorBusqueda = null;

buscador.addEventListener("input", () => {
  clearTimeout(temporizadorBusqueda);
  const texto = buscador.value.trim();

  // Si no hay texto, recarga todas las noticias
  if (texto === "") {
    cargarNoticias(1);
    return;
  }

  // Espera 500ms después de dejar de escribir
  temporizadorBusqueda = setTimeout(() => {
    buscarNoticias(texto);
  }, 500);
});

// Ejecutar búsqueda manual con Enter
buscador.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    const texto = buscador.value.trim();
    if (texto !== "") buscarNoticias(texto);
  }
});

// Llamada al endpoint de búsqueda
function buscarNoticias(texto, pagina = 1) {
  const token = sessionStorage.getItem("access_token");
  const url = `http://localhost:8000/noticia/buscar?query=${encodeURIComponent(texto)}&page=${pagina}&size=10`;

  console.log("📤 Enviando búsqueda a:", url); // 🔍 Verificar query enviada

  fetch(url, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  })
    .then(res => {
      console.log("📥 Respuesta del servidor:", res.status);
      if (!res.ok) throw new Error("Error al buscar noticias");
      return res.json();
    })
    .then(data => {
      console.log("📦 Datos recibidos:", data); // 🔍 Verificar contenido

      if (!data.noticias || data.noticias.length === 0) {
        mostrarNoticias([]);
        return;
      }

      noticiasCargadas = data.noticias;
      mostrarNoticias(noticiasCargadas);
      generarPaginacion(data.total_pages || 1, pagina);

      // Reasigna paginación para la búsqueda
      const contenedor = document.getElementById("paginacion");
      contenedor.querySelectorAll(".pagina-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          buscarNoticias(texto, parseInt(btn.textContent));
        });
      });
    })
    .catch(err => {
      Swal.fire({
        icon: "error",
        title: "Error en búsqueda",
        text: err.message
      });
    });
}
