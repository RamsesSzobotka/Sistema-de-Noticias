import { API_BASE_URL } from "/config/config.js";
import { verificarSesion, cerrarSesion } from "../auth/auth.js";

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
        document.querySelector(".user-info").style.display = "flex";
        document.querySelector(".nav-auth").style.display = "none";
        const usernameDisplay = document.getElementById("usernameDisplay");
        if (usernameDisplay) usernameDisplay.textContent = `Hola, ${session.usuario}`;
        const logoutBtn = document.getElementById("logoutBtn");
        if (logoutBtn) logoutBtn.style.display = "block";
        mostrarBotonesPorRol(session.rol);
    } else {
        document.querySelector(".user-info").style.display = "none";
        document.querySelector(".nav-auth").style.display = "flex";
        usuarioId = null;
    }

    cargarComentarios();

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
        fetch(`${API_BASE_URL}/comentarios/${noticiaId}`)
            .then(res => res.json())
            .then(data => {
                const comentarios = data.usuarios || [];
                commentCount.textContent = data.total || 0;
                const commentsContainer = document.getElementById("commentsContainer");
                commentsContainer.innerHTML = "";
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
        div.className = "comentario";

        if (String(comentario.usuario?.id || comentario.usuario_id) === String(usuarioId)) {
            div.classList.add("comentario-propio");
        }

        const fechaObj = new Date(comentario.fecha_creacion);
        const fecha = fechaObj.toLocaleDateString("es-ES");
        const hora = fechaObj.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: true });

        const header = document.createElement("div");
        header.className = "comentario-header";

        const userDiv = document.createElement("div");
        const strong = document.createElement("strong");
        strong.textContent = comentario.usuario?.username || comentario.usuario || "Anonimo";
        userDiv.appendChild(strong);
        header.appendChild(userDiv);

        const fechaDiv = document.createElement("div");
        fechaDiv.className = "comentario-fecha-hora";
        const fp = document.createElement("p");
        fp.className = "comentario-fecha";
        fp.textContent = fecha;
        fechaDiv.appendChild(fp);
        const hp = document.createElement("p");
        hp.className = "comentario-hora";
        hp.textContent = hora;
        fechaDiv.appendChild(hp);
        header.appendChild(fechaDiv);

        div.appendChild(header);

        const texto = document.createElement("p");
        texto.className = "comentario-texto";
        texto.textContent = comentario.contenido;
        div.appendChild(texto);

        const responderBtn = document.createElement("button");
        responderBtn.className = "responder-btn";
        responderBtn.dataset.id = comentario.id;
        responderBtn.textContent = "Responder";
        responderBtn.addEventListener("click", () => {
            const contenedorRespuestas = div.querySelector(".respuestas");
            contenedorRespuestas.innerHTML = "";
            contenedorRespuestas.appendChild(crearFormularioRespuesta(comentario.id));
        });
        div.appendChild(responderBtn);

        const rol = sessionStorage.getItem("rol");
        if (rol === "admin" || String(comentario.usuario?.id || comentario.usuario_id) === String(usuarioId)) {
            const btnEliminar = document.createElement("button");
            btnEliminar.textContent = "Eliminar";
            btnEliminar.className = "eliminar-btn";
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
            div.appendChild(btnEliminar);
        }

        const contenedorRespuestas = document.createElement("div");
        contenedorRespuestas.className = "respuestas";
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
        btnEnviar.className = "submit-comment";
        const btnCancelar = document.createElement("button");
        btnCancelar.type = "button";
        btnCancelar.textContent = "Cancelar";
        btnCancelar.className = "submit-comment";
        btnCancelar.style.backgroundColor = "#888";
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
            likeBtn.innerHTML = yaDioLike
                ? `<i class="fas fa-thumbs-up"></i> Ya te gusta <span class="like-count">${likeCount.textContent}</span>`
                : `<i class="fas fa-thumbs-up"></i> Like <span class="like-count">${likeCount.textContent}</span>`;
            likeBtn.style.backgroundColor = yaDioLike ? "#6c757d" : "#28a745";
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
        if (noticia.usuario) {
            document.getElementById("publicador").innerText = noticia.usuario.usuario || "";
        }
        const fecha = new Date(noticia.fecha_creacion || noticia.fecha);
        document.getElementById("fecha_creacion").innerText = fecha.toLocaleDateString("es-ES");

        const defaultImg = `${API_BASE_URL}/static/imagenesdb/DEFAULT.png`;
        if (noticia.imagenes && noticia.imagenes.length > 0) {
            const ids = ["imagen1", "imagen2", "imagen3"];
            ids.forEach((id, i) => {
                const img = document.getElementById(id);
                if (img) {
                    img.src = noticia.imagenes[i] ? `${API_BASE_URL}/${noticia.imagenes[i].imagen}` : defaultImg;
                    img.onerror = () => { img.src = defaultImg; };
                }
            });
        } else {
            ["imagen1", "imagen2", "imagen3"].forEach(id => {
                const img = document.getElementById(id);
                if (img) img.src = defaultImg;
            });
        }
    } else {
        document.getElementById("titulo").innerText = "Noticia no encontrada.";
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) logoutBtn.addEventListener("click", cerrarSesion);
});
