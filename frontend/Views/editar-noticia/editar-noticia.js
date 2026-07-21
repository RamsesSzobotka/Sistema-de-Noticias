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
  const markedForReplace = new Set(); // image IDs to replace

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

  // ── Toggle marca de reemplazo en imagen existente ──
  function toggleReplace(imgId, btnEl, wrapperEl) {
    if (markedForReplace.has(imgId)) {
      markedForReplace.delete(imgId);
      wrapperEl.classList.remove("to-replace");
      btnEl.classList.remove("undo");
      btnEl.innerHTML = '<i class="fas fa-times"></i>';
      btnEl.title = "Marcar para reemplazar";
    } else {
      markedForReplace.add(imgId);
      wrapperEl.classList.add("to-replace");
      btnEl.classList.add("undo");
      btnEl.innerHTML = '<i class="fas fa-undo"></i>';
      btnEl.title = "No reemplazar";
    }
    actualizarEstadoUpload();
  }

  // ── Actualizar estado del área de upload ──
  function actualizarEstadoUpload() {
    const marcadas = markedForReplace.size;
    const nuevas = selectedFiles.length;

    if (marcadas === 0 && nuevas === 0) {
      fileCountEl.textContent = "Haz clic en × sobre una imagen para marcarla como reemplazar, luego sube su reemplazo.";
      uploadArea.style.display = "block";
    } else if (nuevas < marcadas) {
      fileCountEl.textContent = `Subí ${marcadas - nuevas} imagen(es) más para completar los reemplazos.`;
      uploadArea.style.display = "block";
    } else if (nuevas === marcadas && marcadas > 0) {
      fileCountEl.textContent = `${nuevas} de ${marcadas} imagen(es) de reemplazo lista(s).`;
      uploadArea.style.display = "none";
    } else if (nuevas > 0 && marcadas === 0) {
      fileCountEl.textContent = `Agregaste ${nuevas} imagen(es). Marcá las actuales que querés reemplazar con ×.`;
      uploadArea.style.display = nuevas >= MAX_IMAGES ? "none" : "block";
    }
  }

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
        actualizarEstadoUpload();
      });

      item.appendChild(img);
      item.appendChild(nameEl);
      item.appendChild(removeBtn);
      previewContainer.appendChild(item);
    });
    actualizarEstadoUpload();
  }

  // ── Click en uploadArea → abrir selector ──
  uploadArea.addEventListener("click", () => inputFile.click());

  // ── Manejar selección de archivos ──
  inputFile.addEventListener("change", () => {
    const marcadas = markedForReplace.size;
    const maxNuevas = marcadas > 0 ? marcadas : MAX_IMAGES;

    const newFiles = Array.from(inputFile.files).filter(
      f => !selectedFiles.some(s => s.name === f.name && s.size === f.size)
    );

    if (newFiles.length === 0) {
      inputFile.value = "";
      return;
    }

    if (selectedFiles.length + newFiles.length > maxNuevas) {
      const permitidas = maxNuevas - selectedFiles.length;
      Swal.fire({
        icon: "warning",
        title: "Límite de imágenes",
        text: marcadas > 0
          ? `Marcaste ${marcadas} para reemplazar. Podés subir ${permitidas} más.`
          : `Máximo ${MAX_IMAGES} imágenes. Podés agregar ${permitidas} más.`,
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

      // Mostrar imágenes existentes con botón de reemplazo
      existingContainer.innerHTML = "";
      if (data.imagenes && data.imagenes.length > 0) {
        data.imagenes.forEach(imgObj => {
          const wrapper = document.createElement("div");
          wrapper.className = "img-wrapper";

          const img = document.createElement("img");
          img.src = `${apiBase}/${imgObj.imagen}`;
          img.alt = "Imagen actual de la noticia";

          const overlay = document.createElement("div");
          overlay.className = "replace-overlay";
          overlay.innerHTML = '<i class="fas fa-exchange-alt"></i> Reemplazar';

          const replaceBtn = document.createElement("button");
          replaceBtn.type = "button";
          replaceBtn.className = "replace-btn";
          replaceBtn.innerHTML = '<i class="fas fa-times"></i>';
          replaceBtn.title = "Marcar para reemplazar";
          replaceBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleReplace(imgObj.id, replaceBtn, wrapper);
          });

          wrapper.appendChild(img);
          wrapper.appendChild(overlay);
          wrapper.appendChild(replaceBtn);
          existingContainer.appendChild(wrapper);
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

    const marcadas = markedForReplace.size;
    const nuevas = selectedFiles.length;

    if (marcadas > 0 && nuevas !== marcadas) {
      Swal.fire({
        icon: "warning",
        title: "Reemplazo incompleto",
        text: marcadas === 1
          ? `Marcaste 1 imagen para reemplazar. Subí 1 imagen nueva.`
          : `Marcaste ${marcadas} imágenes para reemplazar. Subí ${marcadas} imágenes nuevas.`,
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

    // Enviar IDs de imágenes a reemplazar como string separado por comas
    if (markedForReplace.size > 0) {
      formData.set("imagenes_eliminar", [...markedForReplace].join(","));
    }

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
