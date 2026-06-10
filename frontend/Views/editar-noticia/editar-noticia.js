import { API_BASE_URL } from "/config/config.js";
import { verificarSesion, cerrarSesion, initNavbar, cargarVisitas } from "/js/auth.js";

document.addEventListener("DOMContentLoaded", async () => {
  const apiBase = API_BASE_URL;
  const form = document.getElementById("formNoticia");
  const inputFile = document.getElementById("imagen");
  const uploadArea = document.querySelector(".file-upload-area");
  const fileCountEl = uploadArea.querySelector(".file-count");
  const existingContainer = document.getElementById("existingImages");

  const MAX_IMAGES = 3;
  let selectedFiles = [];

  // ── Contenedor de preview ──
  const previewContainer = document.createElement("div");
  previewContainer.id = "previewContainer";
  inputFile.parentNode.insertBefore(previewContainer, inputFile.nextSibling);

  // ── Obtener ID de la noticia ──
  const urlParams = new URLSearchParams(window.location.search);
  const noticiaId = urlParams.get("id");
  if (!noticiaId) {
    Swal.fire({ icon: "error", title: "Error", text: "ID de noticia no proporcionado." })
      .then(() => window.location.href = "/administrar-noticia/");
    return;
  }

  // ── Verificar sesión ──
  const session = await verificarSesion();
  if (!session || !["admin", "editor", "supervisor"].includes(session.rol)) {
    Swal.fire({ icon: "error", title: "No autorizado", text: "No tienes permiso para editar noticias." })
      .then(() => window.location.href = "/administrar-noticia/");
    return;
  }

  document.getElementById("usuario_id").value = session.id;
  initNavbar(session);
  cargarVisitas();

  // ── Renderizar archivos nuevos seleccionados ──
  function renderFileList() {
    previewContainer.innerHTML = "";
    selectedFiles.forEach((file, index) => {
      const item = document.createElement("div");
      item.className = "file-item";

      const img = document.createElement("img");
      img.src = URL.createObjectURL(file);

      const nameEl = document.createElement("span");
      nameEl.className = "file-name";
      nameEl.textContent = file.name;

      const removeBtn = document.createElement("button");
      removeBtn.className = "remove-btn";
      removeBtn.type = "button";
      removeBtn.innerHTML = '<i class="fas fa-times"></i>';
      removeBtn.title = "Quitar imagen";
      removeBtn.addEventListener("click", () => {
        URL.revokeObjectURL(img.src);
        selectedFiles.splice(index, 1);
        renderFileList();
      });

      item.appendChild(img);
      item.appendChild(nameEl);
      item.appendChild(removeBtn);
      previewContainer.appendChild(item);
    });

    const count = selectedFiles.length;
    fileCountEl.textContent = count > 0
      ? `${count} de ${MAX_IMAGES} imágenes nuevas seleccionadas`
      : "Si subes imágenes, deben ser exactamente 3. Déjalo vacío para mantener las actuales.";
    uploadArea.style.display = count >= MAX_IMAGES ? "none" : "block";
  }

  // ── Click en uploadArea → abrir selector ──
  uploadArea.addEventListener("click", () => inputFile.click());

  // ── Manejar selección de archivos ──
  inputFile.addEventListener("change", () => {
    const newFiles = Array.from(inputFile.files).filter(
      f => !selectedFiles.some(s => s.name === f.name && s.size === f.size)
    );

    if (newFiles.length === 0) {
      inputFile.value = "";
      return;
    }

    if (selectedFiles.length + newFiles.length > MAX_IMAGES) {
      const permitidas = MAX_IMAGES - selectedFiles.length;
      Swal.fire({
        icon: "warning",
        title: "Límite de imágenes",
        text: `Máximo ${MAX_IMAGES} imágenes nuevas. Puedes agregar ${permitidas} más.`,
      });
      inputFile.value = "";
      return;
    }

    newFiles.forEach(f => selectedFiles.push(f));
    inputFile.value = "";
    renderFileList();
  });

  // ── Cargar datos de la noticia existente ──
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

      // Mostrar imágenes existentes
      existingContainer.innerHTML = "";
      if (data.imagenes && data.imagenes.length > 0) {
        data.imagenes.forEach(imgObj => {
          const img = document.createElement("img");
          img.src = `${apiBase}/${imgObj.imagen}`;
          img.alt = "Imagen actual de la noticia";
          existingContainer.appendChild(img);
        });
      } else {
        existingContainer.style.display = "none";
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: "Error cargando noticia." });
    }
  }

  // ── Evento submit ──
  form.addEventListener("submit", e => {
    e.preventDefault();

    if (selectedFiles.length > 0 && selectedFiles.length !== MAX_IMAGES) {
      Swal.fire({
        icon: "warning",
        title: "Cantidad invalida",
        text: `Si subes imágenes nuevas, deben ser exactamente ${MAX_IMAGES}.`,
      });
      return;
    }

    Swal.fire({
      title: "¿Actualizar noticia?",
      text: "Los cambios serán revisados antes de publicarse.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, actualizar",
      cancelButtonText: "Cancelar",
    }).then(result => {
      if (result.isConfirmed) actualizarNoticia();
    });
  });

  async function actualizarNoticia() {
    const formData = new FormData(form);
    formData.delete("imagenes");
    selectedFiles.forEach(f => formData.append("imagenes", f));

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
      }).then(() => {
        if (res.ok) window.location.href = "/administrar-noticia/";
      });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: "Error enviando actualización." });
    }
  }

  // ── Inicializar ──
  renderFileList();
  cargarNoticia(noticiaId);
});
