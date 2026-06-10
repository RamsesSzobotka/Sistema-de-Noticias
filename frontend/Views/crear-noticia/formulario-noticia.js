import { API_BASE_URL } from "/config/config.js";
import { verificarSesion, cerrarSesion, initNavbar, cargarVisitas } from "/js/auth.js";

document.addEventListener("DOMContentLoaded", async () => {
    try {
        const session = await verificarSesion();
        if (!session || !["admin","supervisor","editor"].includes(session.rol)) {
            Swal.fire({
                icon: "error",
                title: "Acceso denegado",
                text: "Solo supervisores, administradores y editores pueden crear noticias.",
            }).then(() => window.location.href = "/");
            return;
        }
        document.getElementById("usuario_id").value = session.id;
        initNavbar(session);
        cargarVisitas();
    } catch (err) {
        Swal.fire({
            icon: "error",
            title: "Acceso denegado",
            text: "Debes iniciar sesion.",
        }).then(() => window.location.href = "/");
        return;
    }

    const form = document.getElementById("formNoticia");
    const inputFile = document.getElementById("imagen");
    const uploadArea = document.querySelector(".file-upload-area");
    const fileCountEl = uploadArea.querySelector(".file-count");

    const MAX_IMAGES = 3;
    let selectedFiles = [];

    // ── Crear contenedor de preview ──
    const previewContainer = document.createElement("div");
    previewContainer.id = "previewContainer";
    inputFile.parentNode.insertBefore(previewContainer, inputFile.nextSibling);

    // ── Renderizar lista de archivos seleccionados ──
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

        // Actualizar contador y visibilidad de la zona de upload
        const count = selectedFiles.length;
        fileCountEl.textContent = `${count} de ${MAX_IMAGES} imágenes seleccionadas`;
        uploadArea.style.display = count >= MAX_IMAGES ? "none" : "block";
    }

    // ── Click en uploadArea → abrir selector de archivos ──
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
                text: `Máximo ${MAX_IMAGES} imágenes. Puedes agregar ${permitidas} más.`,
            });
            inputFile.value = "";
            return;
        }

        newFiles.forEach(f => selectedFiles.push(f));
        inputFile.value = ""; // reset para permitir seleccionar de nuevo
        renderFileList();
    });

    // ── Estado inicial ──
    renderFileList();

    // ── Envío del formulario ──
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (selectedFiles.length !== MAX_IMAGES) {
            Swal.fire({
                icon: "warning",
                title: "Imágenes requeridas",
                text: `Debes seleccionar exactamente ${MAX_IMAGES} imágenes.`,
            });
            return;
        }

        const formData = new FormData(form);
        formData.delete("imagenes");
        selectedFiles.forEach(f => formData.append("imagenes", f));

        try {
            const response = await fetch(`${API_BASE_URL}/noticia/`, {
                method: "POST",
                body: formData,
            });
            if (!response.ok) {
                const errData = await response.json();
                Swal.fire("Error", errData.detail || "Error al crear noticia", "error");
                return;
            }
            await response.json();
            Swal.fire({
                icon: "success",
                title: "Noticia creada",
                text: "La noticia se ha creado correctamente.",
            }).then(() => window.location.href = "/");
            form.reset();
            previewContainer.innerHTML = "";
        } catch (err) {
            Swal.fire("Error", "Error de conexión", "error");
        }
    });
});
