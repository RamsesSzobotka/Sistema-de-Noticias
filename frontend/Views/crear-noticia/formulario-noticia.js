import { API_BASE_URL } from "/config/config.js";

document.addEventListener("DOMContentLoaded", async () => {
    const access_token = sessionStorage.getItem("access_token");
    if (!access_token) {
        Swal.fire({
            icon: "error",
            title: "Acceso denegado",
            text: "Debes iniciar sesión primero.",
        }).then(() => window.location.href = "../index.html");
        return;
    }

    // Verificar sesión y rol con JWT
    try {
        const res = await fetch(`${API_BASE_URL}/usuarios/me`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${access_token}`,
                "Content-Type": "application/json"
            }
        });
        if (!res.ok) throw new Error("Token inválido o expirado");
        const data = await res.json();

        if (!["admin","supervisor","editor"].includes(data.rol)) {
            Swal.fire({
                icon: "error",
                title: "Acceso denegado",
                text: "Solo supervisores, administradores y editores pueden crear noticias.",
            }).then(() => window.location.href = "../index.html");
            return;
        }

        document.getElementById("usuario_id").value = data.id;
    } catch (err) {
        console.error(err);
        sessionStorage.clear();
        Swal.fire({
            icon: "error",
            title: "Acceso denegado",
            text: "Debes iniciar sesión.",
        }).then(() => window.location.href = "../index.html");
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
// Envío del formulario
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (inputImagen.files.length !== 3) {
        Swal.fire({
            icon: "warning",
            title: "Cantidad de imágenes",
            text: "Por favor, selecciona exactamente 3 imágenes.",
        });
        return;
    }

    const formData = new FormData();

    formData.append("titulo", document.getElementById("titulo").value);
    formData.append("contenido", document.getElementById("contenido").value);
    formData.append("categoria_id", document.getElementById("categoria").value);
    formData.append("autor", document.getElementById("autor").value);

    Array.from(inputImagen.files).forEach(file => {
        formData.append("imagenes", file);
    });

    Swal.fire({
        title: "Publicando noticia...",
        text: "Por favor, espera",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });

    try {
        const res = await fetch(`${API_BASE_URL}/noticia/`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${access_token}`
            },
            body: formData
        });

        let data;
        try {
            data = await res.json();
        } catch {
            data = null;
        }

        Swal.close();

        if (!res.ok) {
            let mensaje = "Ocurrió un error al enviar los datos.";
            if (res.status === 422) {
                mensaje = "Error en los datos enviados: revisa los campos obligatorios y el formato.";
            } else if (data && data.detail) {
                mensaje = data.detail;
            }

            Swal.fire({
                icon: "error",
                title: "Error",
                text: mensaje,
            });
            return;
        }

        Swal.fire({
            icon: "success",
            title: "Noticia creada",
            text: data.detail || "La noticia fue creada correctamente.",
        }).then(() => window.location.href = "../index.html");

    } catch (error) {
        Swal.close();
        console.error("Error al crear noticia:", error);
        Swal.fire({
            icon: "error",
            title: "Error",
            text: "Ocurrió un error al crear la noticia.",
        });
    }
});

});