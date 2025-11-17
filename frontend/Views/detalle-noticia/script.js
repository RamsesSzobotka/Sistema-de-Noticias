import { API_BASE_URL } from "/config/config.js";

const usuario = sessionStorage.getItem("usuario");
let usuarioId = sessionStorage.getItem("usuario_id");
const rolUsuario = sessionStorage.getItem("rol");
console.log("Usuario ID:", usuarioId);

const likeBtn = document.getElementById("likeBtn");
const likeCount = document.getElementById("likeCount");
const noticia = JSON.parse(localStorage.getItem("noticia"));
const noticiaId = noticia ? noticia.id : null;

const commentForm = document.getElementById("commentForm");
const commentText = document.getElementById("commentText");
const commentCount = document.getElementById("commentCount");

document.addEventListener("DOMContentLoaded", async () => {
    await verificarSesion(); // esperar a que la sesión y usuarioId se establezcan
    cargarComentarios();

    // === Función para verificar sesión con FastAPI ===
    async function verificarSesion() {
        const access_token = sessionStorage.getItem("access_token");
        if (!access_token) {
            document.querySelector(".user-info").style.display = "none";
            document.querySelector(".nav-auth").style.display = "flex";
            usuarioId = null;
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/usuarios/me`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${access_token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!res.ok) {
                // Token inválido o expirado
                sessionStorage.clear();
                document.querySelector(".user-info").style.display = "none";
                document.querySelector(".nav-auth").style.display = "flex";
                usuarioId = null; // asegurar que la variable local también se limpie
                return;
            }

            const data = await res.json();

            // Guardar datos en sessionStorage
            sessionStorage.setItem("usuario_id", data.id);
            sessionStorage.setItem("rol", data.rol);
            sessionStorage.setItem("usuario", data.usuario);

            usuarioId = String(data.id); // <-- actualizar la variable local

            const usernameDisplay = document.getElementById("usernameDisplay");
            if (usernameDisplay) {
                usernameDisplay.textContent = `Hola, ${data.usuario}`;
            }

            document.querySelector(".user-info").style.display = "flex";
            document.querySelector(".nav-auth").style.display = "none";
            const logoutBtn = document.getElementById("logoutBtn");
            if (logoutBtn) logoutBtn.style.display = "block";

            mostrarBotonesPorRol(data.rol);

        } catch (error) {
            console.error("Error al verificar sesión:", error);
        }
    }

    // === Mostrar botones según rol (mismo estilo que tu otro script) ===
    function mostrarBotonesPorRol(rol) {
        const botones = ["btn-editar", "adminBtn", "supervisorPanelBtn", "publicarBtn"];
        botones.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.style.display = "none";
                btn.replaceWith(btn.cloneNode(true)); // limpia eventos previos
            }
        });

        // Botón de perfil
        const perfilBtn = document.getElementById("btn-editar");
        if (perfilBtn) {
            perfilBtn.style.display = "inline-block";
            perfilBtn.addEventListener("click", () => {
                window.location.href = "../editar-usuario/index.html";
            });
        }

        // Botón admin
        if (rol === "admin") {
            const adminBtn = document.getElementById("adminBtn");
            if (adminBtn) {
                adminBtn.style.display = "inline-block";
                adminBtn.addEventListener("click", () => {
                    window.location.href = "../administrar-usuario/index.html";
                });
            }
        }

        // Botones supervisor/editor
        if (["admin", "supervisor", "editor"].includes(rol)) {
            const supervisorBtn = document.getElementById("supervisorPanelBtn");
            if (supervisorBtn) {
                supervisorBtn.style.display = "inline-block";
                supervisorBtn.addEventListener("click", () => {
                    window.location.href = "../administrar-noticia/index.html";
                });
            }

            const publicarBtn = document.getElementById("publicarBtn");
            if (publicarBtn) {
                publicarBtn.style.display = "inline-block";
                publicarBtn.addEventListener("click", () => {
                    window.location.href = "../crear-noticia/index.html";
                });
            }
        }
    }
    // === Cargar comentarios ===
    function cargarComentarios() {
        if (!noticiaId) return;

        fetch(`${API_BASE_URL}/comentarios/${noticiaId}`)
            .then((res) => res.json())
            .then((data) => {
                // ✅ Tu backend devuelve "usuarios" con los comentarios
                const comentarios = data.usuarios || [];
                commentCount.textContent = data.total || 0;

                const commentsContainer = document.getElementById("commentsContainer");
                commentsContainer.innerHTML = "";

                const comentariosMap = {};
                comentarios.forEach((c) => {
                    c.children = [];
                    comentariosMap[c.id] = c;
                });

                const comentariosRaiz = [];
                comentarios.forEach((c) => {
                    if (c.comentario_padre) {
                        if (comentariosMap[c.comentario_padre]) {
                            comentariosMap[c.comentario_padre].children.push(c);
                        }
                    } else {
                        comentariosRaiz.push(c);
                    }
                });

                comentariosRaiz.forEach((comentario) => {
                    const div = renderComentario(comentario);
                    commentsContainer.appendChild(div);
                });
            })
            .catch((err) => console.error("Error cargando comentarios:", err));
    }

    function renderComentario(comentario) {
        const div = document.createElement("div");
        div.className = "comentario";

        // comparar como strings para evitar mismatch tipo number/string
        if (String(comentario.usuario.id) === String(usuarioId)) {
            div.classList.add("comentario-propio");
        }

        const fechaObj = new Date(comentario.fecha_creacion);
        const fecha = fechaObj.toLocaleDateString("es-ES");
        const hora = fechaObj.toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });

        div.innerHTML = `
        <div class="comentario-header">
            <div>
                <p class="comentario-usuario"><strong>${comentario.usuario.username}</strong></p>
            </div>
            <div class="comentario-fecha-hora">
                <p class="comentario-fecha">${fecha}</p>
                <p class="comentario-hora">${hora}</p>
            </div>
        </div>
        <p class="comentario-texto">${comentario.contenido}</p>
        <button class="responder-btn" data-id="${comentario.id}">Responder</button>
        <div class="respuestas"></div>
        `;

        div.querySelector(".responder-btn").addEventListener("click", () => {
            const respuestaForm = crearFormularioRespuesta(comentario.id);
            const contenedorRespuestas = div.querySelector(".respuestas");
            contenedorRespuestas.innerHTML = "";
            contenedorRespuestas.appendChild(respuestaForm);
        });

        const rol = sessionStorage.getItem("rol");
        if (rol === "admin" || String(comentario.usuario.id) === String(usuarioId)) {
            const btnEliminar = document.createElement("button");
            btnEliminar.textContent = "Eliminar";
            btnEliminar.className = "eliminar-btn";
            btnEliminar.addEventListener("click", () => {
                Swal.fire({
                    title: "¿Eliminar comentario?",
                    text: "Esta acción no se puede deshacer.",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#d33",
                    cancelButtonColor: "#3085d6",
                    confirmButtonText: "Sí, eliminar",
                    cancelButtonText: "Cancelar",
                }).then((result) => {
                    if (result.isConfirmed) {
                        eliminarComentario(comentario.id);
                    }
                });
            });
            div.appendChild(btnEliminar);
        }

        const contenedorRespuestas = div.querySelector(".respuestas");
        comentario.children.forEach((child) => {
            const childDiv = renderComentario(child);
            contenedorRespuestas.appendChild(childDiv);
        });

        return div;
    }

    function crearFormularioRespuesta(comentarioPadreId) {
        const form = document.createElement("form");
        form.className = "form-respuesta";

        const textarea = document.createElement("textarea");
        textarea.placeholder = "Escribe una respuesta...";
        textarea.required = true;

        const botones = document.createElement("div");
        botones.style.display = "flex";
        botones.style.gap = "10px";
        botones.style.marginTop = "10px";

        const btnEnviar = document.createElement("button");
        btnEnviar.type = "submit";
        btnEnviar.textContent = "Enviar respuesta";
        btnEnviar.className = "submit-comment";

        const btnCancelar = document.createElement("button");
        btnCancelar.type = "button";
        btnCancelar.textContent = "Cancelar";
        btnCancelar.className = "submit-comment";
        btnCancelar.style.backgroundColor = "#888";

        btnCancelar.addEventListener("click", () => {
            form.remove();
        });

        botones.appendChild(btnEnviar);
        botones.appendChild(btnCancelar);

        form.appendChild(textarea);
        form.appendChild(botones);

        form.addEventListener("submit", function (e) {
            e.preventDefault();
            publicarComentario(textarea.value.trim(), comentarioPadreId);
        });

        return form;
    }

    commentForm.addEventListener("submit", function (e) {
        e.preventDefault();
        publicarComentario(commentText.value.trim(), null);
    });

    async function publicarComentario(contenido, comentarioPadreId) {
        if (!usuarioId) {
            Swal.fire({
                icon: "warning",
                title: "Debes iniciar sesión",
                text: "Inicia sesión para poder comentar.",
                confirmButtonColor: "#3085d6",
                confirmButtonText: "Iniciar sesión",
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = "../auth/iniciar-sesion/index.html";
                }
            });
            return;
        }

        if (!contenido) {
            Swal.fire("Advertencia", "El comentario no puede estar vacío.", "warning");
            return;
        }

        const token = sessionStorage.getItem("access_token");

        const res = await fetch(`${API_BASE_URL}/comentarios/`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                noticia_id: noticiaId,
                contenido: contenido,
                comentario_padre_id: comentarioPadreId,
            }),
        });

        const data = await res.json();

        if (res.ok) {
            Swal.fire("Éxito", data.detail, "success");
            commentText.value = "";
            cargarComentarios();
        } else {
            Swal.fire("Error", data.detail || "No se pudo publicar el comentario.", "error");
        }
    }

    async function eliminarComentario(id) {
        const token = sessionStorage.getItem("access_token");

        const res = await fetch(`${API_BASE_URL}/comentarios/?id=${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`,
            },
        });

        const data = await res.json();

        if (res.ok) {
            Swal.fire("Eliminado", data.detail, "success");
            cargarComentarios();
        } else {
            Swal.fire("Error", data.detail || "No se pudo eliminar el comentario.", "error");
        }
    }
// === Sistema de Likes ===
if (!noticiaId) {
    console.error("⚠️ No se pudo encontrar la noticia.");
} else {
    const token = sessionStorage.getItem("access_token");
    let yaDioLike = false;

    async function inicializarLikes() {
        try {
            // 1️⃣ Obtener total de likes
            const resLikes = await fetch(`${API_BASE_URL}/like/${noticiaId}`);
            const dataLikes = await resLikes.json();
            likeCount.textContent = dataLikes.total_likes || 0;

            // 2️⃣ Verificar si el usuario actual ya dio like (solo si está logueado)
            if (usuarioId && token) {
                const resUsuarioLike = await fetch(`${API_BASE_URL}/like/me/${noticiaId}`, {
                    headers: { "Authorization": `Bearer ${token}` },
                });
                const dataUsuarioLike = await resUsuarioLike.json();
                yaDioLike = dataUsuarioLike.liked || false;
            }

            // 3️⃣ Actualizar estado visual del botón
            actualizarBotonLike();

        } catch (err) {
            console.error("Error al inicializar likes:", err);
        }
    }

    function actualizarBotonLike() {
        if (yaDioLike) {
            likeBtn.innerHTML = `<i class="fas fa-thumbs-up"></i> Ya te gusta <span class="like-count">${likeCount.textContent}</span>`;
            likeBtn.style.backgroundColor = "#6c757d"; // gris
        } else {
            likeBtn.innerHTML = `<i class="fas fa-thumbs-up"></i> Like <span class="like-count">${likeCount.textContent}</span>`;
            likeBtn.style.backgroundColor = "#28a745"; // verde
        }
    }

    async function darLike() {
        try {
            const res = await fetch(`${API_BASE_URL}/like/?noticiaId=${noticiaId}`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) {
                yaDioLike = true;
                likeCount.textContent = parseInt(likeCount.textContent) + 1;
                actualizarBotonLike();
            } else {
                console.error("Error al dar like:", data.detail);
            }
        } catch (err) {
            console.error("Error al dar like:", err);
        }
    }

    async function quitarLike() {
        try {
            const res = await fetch(`${API_BASE_URL}/like/?noticiaId=${noticiaId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) {
                yaDioLike = false;
                likeCount.textContent = Math.max(0, parseInt(likeCount.textContent) - 1);
                actualizarBotonLike();
            } else {
                console.error("Error al quitar like:", data.detail);
            }
        } catch (err) {
            console.error("Error al quitar like:", err);
        }
    }

    // Evento del botón
    likeBtn.addEventListener("click", () => {
        if (!usuarioId) {
            Swal.fire({
                icon: "warning",
                title: "Inicia sesión",
                text: "Debes estar logueado para dar like.",
                confirmButtonColor: "#3085d6",
                confirmButtonText: "Iniciar sesión",
            }).then((result) => {
                if (result.isConfirmed) window.location.href = "../auth/iniciar-sesion/index.html";
            });
            return;
        }

        if (yaDioLike) {
            quitarLike();
        } else {
            darLike();
        }
    });

    // Inicializar todo
    inicializarLikes();
}


    if (noticia) {
        document.getElementById("titulo").innerText = noticia.titulo;
        document.getElementById("contenido").innerText = noticia.contenido;
        document.getElementById("autor").innerText = noticia.autor;
        document.getElementById("publicador").innerText = `${noticia.usuario.usuario}`;

        const fecha = new Date(noticia.fecha_creacion || noticia.fecha);
        document.getElementById("fecha_creacion").innerText = fecha.toLocaleDateString("es-ES");

        if (noticia.imagenes && noticia.imagenes.length > 0) {
            const imagen1 = document.getElementById("imagen1");
            const imagen2 = document.getElementById("imagen2");
            const imagen3 = document.getElementById("imagen3");

            const defaultImg = `${API_BASE_URL}/static/imagenesdb/DEFAULT.png`;

            imagen1.src = `${API_BASE_URL}/` + (noticia.imagenes[0]?.imagen || "static/imagenesdb/DEFAULT.png");
            imagen2.src = `${API_BASE_URL}/` + (noticia.imagenes[1]?.imagen || "static/imagenesdb/DEFAULT.png");
            imagen3.src = `${API_BASE_URL}/` + (noticia.imagenes[2]?.imagen || "static/imagenesdb/DEFAULT.png");

            // Si falla la carga, usar la imagen por defecto
            [imagen1, imagen2, imagen3].forEach(img => {
                img.onerror = () => {
                    img.src = defaultImg;
                };
            });
        } else {
            // Si no hay imágenes asociadas
            const defaultImg = `${API_BASE_URL}/static/imagenesdb/DEFAULT.png`;
            document.getElementById("imagen1").src = defaultImg;
            document.getElementById("imagen2").src = defaultImg;
            document.getElementById("imagen3").src = defaultImg;
        }

    } else {
        document.getElementById("titulo").innerText = "Noticia no encontrada.";
    }
});

// === Logout ===
function logout() {
    Swal.fire({
        title: "¿Estás seguro?",
        text: "¿Deseas cerrar sesión?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sí, cerrar sesión",
        cancelButtonText: "Cancelar",
    }).then((result) => {
        if (result.isConfirmed) {
            sessionStorage.clear();
            window.location.href = "../index.html";
        }
    });
}