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
    const inputImagen = document.getElementById("imagen");

    // Contenedor para previsualización de imágenes
    const previewContainer = document.createElement("div");
    previewContainer.id = "previewContainer";
    previewContainer.style.display = "flex";
    previewContainer.style.gap = "10px";
    previewContainer.style.marginTop = "10px";
    inputImagen.parentNode.insertBefore(previewContainer, inputImagen.nextSibling);

    inputImagen.addEventListener("change", () => {
        previewContainer.innerHTML = "";
        Array.from(inputImagen.files).forEach(file => {
            const reader = new FileReader();
            reader.onload = e => {
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

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
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
            const data = await response.json();
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
