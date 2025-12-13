import { API_BASE_URL } from "../../config/config.js";

document.addEventListener("DOMContentLoaded", () => {
  const apiBase = API_BASE_URL;
  const token = sessionStorage.getItem("access_token");

  if (!token) {
    Swal.fire({
      icon: "warning",
      title: "Sesión expirada",
      text: "Debes iniciar sesión nuevamente.",
    }).then(() => (window.location.href = "../auth/iniciar-sesion/index.html"));
    return;
  }

  const form = document.getElementById("formNoticia");
  console.log(form)
  const inputImagen = document.getElementById("imagen");

  // Contenedor para previsualización
  const previewContainer = document.createElement("div");
  previewContainer.id = "previewContainer";
  previewContainer.style.display = "flex";
  previewContainer.style.gap = "10px";
  previewContainer.style.marginTop = "10px";
  inputImagen.parentNode.insertBefore(previewContainer, inputImagen.nextSibling);

  // Obtener ID desde URL
  const urlParams = new URLSearchParams(window.location.search);
  const noticiaId = urlParams.get("id");
  if (!noticiaId) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "ID de noticia no proporcionado.",
    }).then(() => (window.location.href = "../administrar-noticia/index.html"));
    return;
  }

  // ==========================
  // 1️⃣ Verificar permisos
  // ==========================
  verificarPermiso().then((permitido) => {
    if (!permitido) return;
    cargarNoticia(noticiaId);
    agregarEventos();
  });

  async function verificarPermiso() {
    try {
      const res = await fetch(`${apiBase}/usuarios/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok || !["admin", "editor", "supervisor"].includes(data.rol)) {
        Swal.fire({
          icon: "error",
          title: "No autorizado",
          text: "No tienes permiso para editar noticias.",
        }).then(() => (window.location.href = "../administrar-noticia/index.html"));
        return false;
      }

      // Guardamos ID usuario
      document.getElementById("usuario_id").value = data.id;
      return true;
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error verificando sesión.",
      });
      return false;
    }
  }

  // ==========================
  // 2️⃣ Cargar noticia existente
  // ==========================
  async function cargarNoticia(id) {
    try {
      const res = await fetch(`${apiBase}/noticia/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok || !data) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.detail || "No se encontró la noticia.",
        }).then(() => (window.location.href = "../administrar-noticia/index.html"));
        return;
      }

      // Rellenar campos
      document.getElementById("noticia_id").value = data.id;
      document.getElementById("titulo").value = data.titulo;
      document.getElementById("contenido").value = data.contenido;
      document.getElementById("categoria").value = data.categoria.id;
      document.getElementById("autor").value = data.autor;

      // Mostrar imágenes actuales
      previewContainer.innerHTML = "";
      if (data.imagenes && data.imagenes.length > 0) {
        data.imagenes.forEach((imgObj) => {
          const img = document.createElement("img");
          img.src = `${apiBase}/${imgObj.imagen}`;
          img.style.width = "100px";
          img.style.height = "100px";
          img.style.objectFit = "cover";
          img.style.border = "1px solid #ccc";
          img.style.borderRadius = "4px";
          previewContainer.appendChild(img);
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error cargando noticia.",
      });
    }
  }

  // ==========================
  // 3️⃣ Previsualizar nuevas imágenes
  // ==========================
  function agregarEventos() {
    inputImagen.addEventListener("change", () => {
      previewContainer.innerHTML = "";
      const files = inputImagen.files;
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = document.createElement("img");
          img.src = e.target.result;
          img.style.width = "100px";
          img.style.height = "100px";
          img.style.objectFit = "cover";
          img.style.border = "1px solid #ccc";
          img.style.borderRadius = "4px";
          previewContainer.appendChild(img);
        };
        reader.readAsDataURL(file);
      });
    });

    // ==========================
    // 4️⃣ Enviar actualización
    // ==========================
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const nuevasImagenes = inputImagen.files;
      if (nuevasImagenes.length > 0 && nuevasImagenes.length !== 3) {
        Swal.fire({
          icon: "warning",
          title: "Cantidad inválida",
          text: "Debes subir exactamente 3 imágenes o dejar el campo vacío.",
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
      }).then((result) => {
        if (result.isConfirmed) {
          actualizarNoticia();
        }
      });
    });
  }

  // ==========================
  // 5️⃣ PUT /noticia/
  // ==========================
  async function actualizarNoticia() {
    const formData = new FormData(form);
    const nuevasImagenes = inputImagen.files;

    // Si no hay nuevas imágenes, no se envía el campo
    if (nuevasImagenes.length === 0) {
      formData.delete("imagenes");
    }

    try {
      const res = await fetch(`${apiBase}/noticia/`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      
      Swal.fire({
        icon: res.ok ? "success" : "error",
        title: res.ok ? "Noticia actualizada" : "Error",
        text: data.detail || "Error al actualizar la noticia.",
      }).then(() => {
        if (res.ok) window.location.href = "../administrar-noticia/index.html";
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error enviando actualización.",
      });
    }
  }
});