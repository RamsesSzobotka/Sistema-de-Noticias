import { API_BASE_URL } from "/config/config.js";
import { verificarSesion, cerrarSesion, initNavbar, cargarVisitas } from "/js/auth.js";

document.addEventListener("DOMContentLoaded", async () => {
  const apiBase = API_BASE_URL;

  const form = document.getElementById("formNoticia");
  const inputImagen = document.getElementById("imagen");

  const previewContainer = document.createElement("div");
  previewContainer.id = "previewContainer";
  previewContainer.style.cssText = "display:flex;gap:10px;margin-top:10px;";
  inputImagen.parentNode.insertBefore(previewContainer, inputImagen.nextSibling);

  const urlParams = new URLSearchParams(window.location.search);
  const noticiaId = urlParams.get("id");
  if (!noticiaId) {
    Swal.fire({ icon: "error", title: "Error", text: "ID de noticia no proporcionado." })
      .then(() => window.location.href = "/administrar-noticia/");
    return;
  }

  const session = await verificarSesion();
  if (!session || !["admin", "editor", "supervisor"].includes(session.rol)) {
    Swal.fire({ icon: "error", title: "No autorizado", text: "No tienes permiso para editar noticias." })
      .then(() => window.location.href = "/administrar-noticia/");
    return;
  }

  document.getElementById("usuario_id").value = session.id;

  initNavbar(session);
  cargarVisitas();

  cargarNoticia(noticiaId);
  agregarEventos();

  async function cargarNoticia(id) {
    try {
      const res = await fetch(`${apiBase}/noticia/${id}`);
      const data = await res.json();
      if (!res.ok || !data) {
        Swal.fire({ icon: "error", title: "Error", text: data.detail || "No se encontro la noticia." })
          .then(() => window.location.href = "/administrar-noticia/");
        return;
      }
      document.getElementById("noticia_id").value = data.id;
      document.getElementById("titulo").value = data.titulo;
      document.getElementById("contenido").value = data.contenido;
      document.getElementById("categoria").value = data.categoria.id;
      document.getElementById("autor").value = data.autor;

      previewContainer.innerHTML = "";
      if (data.imagenes && data.imagenes.length > 0) {
        data.imagenes.forEach(imgObj => {
          const img = document.createElement("img");
          img.src = `${apiBase}/${imgObj.imagen}`;
          img.style.cssText = "width:100px;height:100px;object-fit:cover;border:1px solid #ccc;border-radius:4px;";
          previewContainer.appendChild(img);
        });
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: "Error cargando noticia." });
    }
  }

  function agregarEventos() {
    inputImagen.addEventListener("change", () => {
      previewContainer.innerHTML = "";
      Array.from(inputImagen.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = e => {
          const img = document.createElement("img");
          img.src = e.target.result;
          img.style.cssText = "width:100px;height:100px;object-fit:cover;border:1px solid #ccc;border-radius:4px;";
          previewContainer.appendChild(img);
        };
        reader.readAsDataURL(file);
      });
    });

    form.addEventListener("submit", e => {
      e.preventDefault();
      const nuevasImagenes = inputImagen.files;
      if (nuevasImagenes.length > 0 && nuevasImagenes.length !== 3) {
        Swal.fire({ icon: "warning", title: "Cantidad invalida", text: "Debes subir exactamente 3 imagenes o dejar el campo vacio." });
        return;
      }
      Swal.fire({
        title: "Actualizar noticia?", text: "Los cambios seran revisados antes de publicarse.",
        icon: "question", showCancelButton: true, confirmButtonText: "Si, actualizar", cancelButtonText: "Cancelar",
      }).then(result => { if (result.isConfirmed) actualizarNoticia(); });
    });
  }

  async function actualizarNoticia() {
    const formData = new FormData(form);
    if (inputImagen.files.length === 0) formData.delete("imagenes");

    try {
      const res = await fetch(`${apiBase}/noticia/`, {
        method: "PUT",
        body: formData,
      });
      const data = await res.json();
      Swal.fire({
        icon: res.ok ? "success" : "error",
        title: res.ok ? "Noticia actualizada" : "Error",
        text: data.detail || "Error al actualizar la noticia.",
      }).then(() => { if (res.ok) window.location.href = "/administrar-noticia/"; });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: "Error enviando actualizacion." });
    }
  }
});
