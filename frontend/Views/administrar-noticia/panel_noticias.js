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
    window.location.href = "../login.html";
  });
}

// Cargar noticias según el rol
function cargarNoticias() {
  const token = sessionStorage.getItem("access_token");
  const endpoint =
    rolUsuario === "editor"
      ? "http://localhost:8000/noticia/all?page=1&size=20"
      : "http://localhost:8000/noticia/all?page=1&size=20";

  fetch(endpoint, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  })
    .then(res => res.json())
    .then(data => {
      noticiasCargadas = data.noticias || [];
      mostrarNoticias(noticiasCargadas);
    })
    .catch(() => {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar las noticias."
      });
    });
}

// Mostrar noticias en tabla
function mostrarNoticias(noticias) {
  const tbody = document.querySelector("#noticiasTable tbody");
  tbody.innerHTML = "";

  if (!noticias || noticias.length === 0) {
    const filaVacia = document.createElement("tr");
    filaVacia.innerHTML = `
      <td colspan="9" style="text-align: center; font-weight: bold; padding: 20px;">
        No hay noticias disponibles.
      </td>
    `;
    tbody.appendChild(filaVacia);
    return;
  }

  noticias.forEach(noticia => {
    const fila = document.createElement("tr");
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
                onerror="this.src='/imagenesDB/default.png'; this.onerror=null;">`
          )
          .join("")}
      </td>
      <td>${noticia.fecha_creacion}</td>
      <td>
        <button class="btn-estado" data-id="${noticia.id}">
          ${noticia.activo ? "Desactivar" : "Activar"}
        </button>
      </td>
      <td>
        <button class="btn-editar" data-id="${noticia.id}">Editar</button>
      </td>
    `;
    tbody.appendChild(fila);
  });

  // Evento cambiar estado
  document.querySelectorAll(".btn-estado").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      actualizarEstado(id);
    });
  });

  // Evento editar noticia
  document.querySelectorAll(".btn-editar").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      window.location.href = `../editar-noticia/index.html?id=${id}`;
    });
  });
}

// PATCH estado de noticia
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
      cargarNoticias();
    })
    .catch(() => {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo actualizar el estado."
      });
    });
}
