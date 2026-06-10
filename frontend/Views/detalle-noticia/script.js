import { API_BASE_URL } from "/config/config.js";
import { verificarSesion, cerrarSesion, mostrarBotonesPorRol } from "/js/auth.js";

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-PA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

let usuarioId = sessionStorage.getItem("usuario_id");

const likeBtn = document.getElementById("likeBtn");
const likeCount = document.getElementById("likeCount");
const noticia = JSON.parse(localStorage.getItem("noticia"));
const noticiaId = noticia ? noticia.id : null;

const commentForm = document.getElementById("commentForm");
const commentText = document.getElementById("commentText");
const commentCount = document.getElementById("commentCount");

document.addEventListener("DOMContentLoaded", async () => {
    const session = await verificarSesion();
    if (session) {
        usuarioId = String(session.id);
        document.getElementById("navbarUser").classList.add("show");
        document.getElementById("navbarAuth").style.display = "none";
        const usernameDisplay = document.getElementById("usernameDisplay");
        if (usernameDisplay) usernameDisplay.textContent = `Hola, ${session.usuario}`;
        mostrarBotonesPorRol(session.rol);
    } else {
        document.getElementById("navbarUser").classList.remove("show");
        document.getElementById("navbarAuth").style.display = "flex";
        usuarioId = null;
    }

    cargarComentarios();

    // Hamburger menu toggle
    const hamburger = document.getElementById('hamburgerBtn');
    const navbarMenu = document.getElementById('navbarMenu');
    if (hamburger && navbarMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navbarMenu.classList.toggle('active');
        });
    }

    function mostrarBotonesPorRol(rol) {
        const botones = ["btn-editar", "adminBtn", "supervisorPanelBtn", "publicarBtn"];
        botones.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) { btn.style.display = "none"; btn.replaceWith(btn.cloneNode(true)); }
        });
        const perfilBtn = document.getElementById("btn-editar");
        if (perfilBtn) {
            perfilBtn.style.display = "inline-block";
            perfilBtn.addEventListener("click", () => window.location.href = "../editar-usuario/index.html");
        }
        if (rol === "admin") {
            const adminBtn = document.getElementById("adminBtn");
            if (adminBtn) {
                adminBtn.style.display = "inline-block";
                adminBtn.addEventListener("click", () => window.location.href = "../administrar-usuario/index.html");
            }
        }
        if (["admin", "supervisor", "editor"].includes(rol)) {
            const supervisorBtn = document.getElementById("supervisorPanelBtn");
            if (supervisorBtn) {
                supervisorBtn.style.display = "inline-block";
                supervisorBtn.addEventListener("click", () => window.location.href = "../administrar-noticia/index.html");
            }
            const publicarBtn = document.getElementById("publicarBtn");
            if (publicarBtn) {
                publicarBtn.style.display = "inline-block";
                publicarBtn.addEventListener("click", () => window.location.href = "../crear-noticia/index.html");
            }
        }
    }

    function cargarComentarios() {
        if (!noticiaId) return;
        const commentsContainer = document.getElementById("commentsContainer");
        if (commentsContainer) {
            commentsContainer.innerHTML = '<div class="spinner"></div>';
        }
        fetch(`${API_BASE_URL}/comentarios/${noticiaId}`)
            .then(res => res.json())
            .then(data => {
                const comentarios = data.usuarios || [];
                commentCount.textContent = data.total || 0;
                if (commentsContainer) commentsContainer.innerHTML = "";
                if (comentarios.length === 0) {
                    if (commentsContainer) {
                        commentsContainer.innerHTML = '<p class="text-muted text-center">No hay comentarios aún. ¡Sé el primero en comentar!</p>';
                    }
                    return;
                }
                const comentariosMap = {};
                comentarios.forEach(c => { c.children = []; comentariosMap[c.id] = c; });
                const comentariosRaiz = [];
                comentarios.forEach(c => {
                    if (c.comentario_padre) {
                        if (comentariosMap[c.comentario_padre]) comentariosMap[c.comentario_padre].children.push(c);
                    } else {
                        comentariosRaiz.push(c);
                    }
                });
                comentariosRaiz.forEach(comentario => commentsContainer.appendChild(renderComentario(comentario)));
            })
            .catch(err => console.error("Error cargando comentarios:", err));
    }

    function renderComentario(comentario) {
        const div = document.createElement("div");
        div.className = "comment";

        const initial = (comentario.usuario?.username || comentario.usuario || 'A')[0].toUpperCase();
        
        const avatar = document.createElement("div");
        avatar.className = "comment-avatar";
        avatar.textContent = initial;
        div.appendChild(avatar);

        const body = document.createElement("div");
        body.className = "comment-body";

        const header = document.createElement("div");
        header.className = "comment-header";

        const author = document.createElement("span");
        author.className = "comment-author";
        author.textContent = comentario.usuario?.username || comentario.usuario || "Anónimo";
        header.appendChild(author);

        const dateSpan = document.createElement("span");
        dateSpan.className = "comment-date";
        dateSpan.textContent = formatDate(comentario.fecha_creacion);
        header.appendChild(dateSpan);

        body.appendChild(header);

        const texto = document.createElement("p");
        texto.className = "comment-text";
        texto.textContent = comentario.contenido || comentario.texto;
        body.appendChild(texto);

        const actions = document.createElement("div");
        actions.className = "comment-actions";

        const responderBtn = document.createElement("button");
        responderBtn.className = "comment-action-btn";
        responderBtn.dataset.id = comentario.id;
        responderBtn.textContent = "Responder";
        responderBtn.addEventListener("click", () => {
            const contenedorRespuestas = div.querySelector(".respuestas");
            if (contenedorRespuestas) {
                contenedorRespuestas.innerHTML = "";
                contenedorRespuestas.appendChild(crearFormularioRespuesta(comentario.id));
            }
        });
        actions.appendChild(responderBtn);

        const rol = sessionStorage.getItem("rol");
        if (rol === "admin" || String(comentario.usuario?.id || comentario.usuario_id) === String(usuarioId)) {
            const btnEliminar = document.createElement("button");
            btnEliminar.textContent = "Eliminar";
            btnEliminar.className = "comment-action-btn danger";
            btnEliminar.addEventListener("click", () => {
                Swal.fire({
                    title: "Eliminar comentario?",
                    text: "Esta accion no se puede deshacer.",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#d33",
                    cancelButtonColor: "#3085d6",
                    confirmButtonText: "Si, eliminar",
                    cancelButtonText: "Cancelar",
                }).then(result => { if (result.isConfirmed) eliminarComentario(comentario.id); });
            });
            actions.appendChild(btnEliminar);
        }

        body.appendChild(actions);
        div.appendChild(body);

        const contenedorRespuestas = document.createElement("div");
        contenedorRespuestas.className = "comment-nested respuestas";
        div.appendChild(contenedorRespuestas);

        if (comentario.children) {
            comentario.children.forEach(child => contenedorRespuestas.appendChild(renderComentario(child)));
        }

        return div;
    }

    function crearFormularioRespuesta(comentarioPadreId) {
        const form = document.createElement("form");
        form.className = "form-respuesta";
        const textarea = document.createElement("textarea");
        textarea.placeholder = "Escribe una respuesta...";
        textarea.required = true;
        const botones = document.createElement("div");
        botones.style.cssText = "display:flex;gap:10px;margin-top:10px;";
        const btnEnviar = document.createElement("button");
        btnEnviar.type = "submit";
        btnEnviar.textContent = "Enviar respuesta";
        btnEnviar.className = "comment-submit-btn";
        const btnCancelar = document.createElement("button");
        btnCancelar.type = "button";
        btnCancelar.textContent = "Cancelar";
        btnCancelar.className = "comment-submit-btn";
        // Button inherits styles from .comment-submit-btn
        btnCancelar.addEventListener("click", () => form.remove());
        botones.appendChild(btnEnviar);
        botones.appendChild(btnCancelar);
        form.appendChild(textarea);
        form.appendChild(botones);
        form.addEventListener("submit", e => { e.preventDefault(); publicarComentario(textarea.value.trim(), comentarioPadreId); });
        return form;
    }

    commentForm.addEventListener("submit", e => { e.preventDefault(); publicarComentario(commentText.value.trim(), null); });

    async function publicarComentario(contenido, comentarioPadreId) {
        if (!usuarioId) {
            Swal.fire({
                icon: "warning", title: "Debes iniciar sesion",
                text: "Inicia sesion para poder comentar.",
                confirmButtonColor: "#3085d6", confirmButtonText: "Iniciar sesion",
            }).then(result => { if (result.isConfirmed) window.location.href = "../auth/iniciar-sesion/index.html"; });
            return;
        }
        if (!contenido) { Swal.fire("Advertencia", "El comentario no puede estar vacio.", "warning"); return; }

        const res = await fetch(`${API_BASE_URL}/comentarios/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ noticia_id: noticiaId, contenido, comentario_padre_id: comentarioPadreId }),
        });
        const data = await res.json();
        if (res.ok) {
            Swal.fire("Exito", data.detail, "success");
            commentText.value = "";
            cargarComentarios();
        } else {
            Swal.fire("Error", data.detail || "No se pudo publicar el comentario.", "error");
        }
    }

    async function eliminarComentario(id) {
        const res = await fetch(`${API_BASE_URL}/comentarios/?id=${id}`, { method: "DELETE" });
        const data = await res.json();
        if (res.ok) { Swal.fire("Eliminado", data.detail, "success"); cargarComentarios(); }
        else { Swal.fire("Error", data.detail || "No se pudo eliminar.", "error"); }
    }

    if (noticiaId) {
        async function inicializarLikes() {
            try {
                const resLikes = await fetch(`${API_BASE_URL}/like/${noticiaId}`);
                const dataLikes = await resLikes.json();
                likeCount.textContent = dataLikes.total_likes || 0;
                if (usuarioId) {
                    const resUsuarioLike = await fetch(`${API_BASE_URL}/like/me/${noticiaId}`);
                    const dataUsuarioLike = await resUsuarioLike.json();
                    yaDioLike = dataUsuarioLike.liked || false;
                }
                actualizarBotonLike();
            } catch (err) { console.error("Error al inicializar likes:", err); }
        }

        let yaDioLike = false;

        function actualizarBotonLike() {
            likeBtn.classList.toggle("liked", yaDioLike);
        }

        async function darLike() {
            try {
                const res = await fetch(`${API_BASE_URL}/like/?noticiaId=${noticiaId}`, { method: "POST" });
                const data = await res.json();
                if (res.ok) { yaDioLike = true; likeCount.textContent = parseInt(likeCount.textContent) + 1; actualizarBotonLike(); }
                else { console.error("Error al dar like:", data.detail); }
            } catch (err) { console.error("Error al dar like:", err); }
        }

        async function quitarLike() {
            try {
                const res = await fetch(`${API_BASE_URL}/like/?noticiaId=${noticiaId}`, { method: "DELETE" });
                const data = await res.json();
                if (res.ok) { yaDioLike = false; likeCount.textContent = Math.max(0, parseInt(likeCount.textContent) - 1); actualizarBotonLike(); }
                else { console.error("Error al quitar like:", data.detail); }
            } catch (err) { console.error("Error al quitar like:", err); }
        }

        likeBtn.addEventListener("click", () => {
            if (!usuarioId) {
                Swal.fire({
                    icon: "warning", title: "Inicia sesion",
                    text: "Debes estar logueado para dar like.",
                    confirmButtonColor: "#3085d6", confirmButtonText: "Iniciar sesion",
                }).then(result => { if (result.isConfirmed) window.location.href = "../auth/iniciar-sesion/index.html"; });
                return;
            }
            yaDioLike ? quitarLike() : darLike();
        });

        inicializarLikes();
    }

    if (noticia) {
        document.getElementById("titulo").innerText = noticia.titulo;
        document.getElementById("contenido").innerText = noticia.contenido;
        document.getElementById("autor").innerText = noticia.autor;

        const fecha = new Date(noticia.fecha_creacion || noticia.fecha);
        document.getElementById("fecha_creacion").innerText = fecha.toLocaleDateString("es-ES", {
            year: "numeric", month: "long", day: "numeric"
        });

        // Category badge
        const categoriaBadge = document.getElementById("categoriaBadge");
        if (categoriaBadge && noticia.categoria) {
            categoriaBadge.textContent = noticia.categoria;
        }

        // Reading time
        const readingTime = document.getElementById("readingTime");
        if (readingTime && noticia.contenido) {
            const wordsPerMinute = 200;
            const wordCount = noticia.contenido.split(/\s+/).length;
            const minutes = Math.ceil(wordCount / wordsPerMinute);
            readingTime.textContent = `${minutes} min de lectura`;
        }

        const defaultImg = 'data:image/svg+xml,' + encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">' +
            '<rect fill="#F3F4F6" width="800" height="450"/>' +
            '<text fill="#9CA3AF" font-family="Arial,sans-serif" font-size="18" text-anchor="middle" x="400" y="225">Sin imagen disponible</text>' +
            '</svg>'
        );
        if (noticia.imagenes && noticia.imagenes.length > 0) {
            const ids = ["imagen1", "imagen2", "imagen3"];
            ids.forEach((id, i) => {
                const img = document.getElementById(id);
                if (img) {
                    const src = noticia.imagenes[i] ? `${API_BASE_URL}/${noticia.imagenes[i].imagen}` : defaultImg;
                    img.src = src;
                    img.style.display = "";
                    img.onerror = () => { img.src = defaultImg; };
                }
            });
        } else {
            ["imagen1", "imagen2", "imagen3"].forEach(id => {
                const img = document.getElementById(id);
                if (img) {
                    img.src = defaultImg;
                    if (id !== "imagen1") img.style.display = "none";
                }
            });
        }
    } else {
        document.getElementById("titulo").innerText = "Noticia no encontrada.";
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) logoutBtn.addEventListener("click", cerrarSesion);

    // Category dropdown navigates to home with filter
    const categorySelect = document.getElementById("categorySelect");
    if (categorySelect) {
        categorySelect.addEventListener("change", (e) => {
            localStorage.setItem("selectedCategory", e.target.value);
            window.location.href = "../index.html";
        });
    }
});
