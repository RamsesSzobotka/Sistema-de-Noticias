import { API_BASE_URL } from "/config/config.js";
import { verificarSesion, cerrarSesion, initNavbar, cargarVisitas } from "/js/auth.js";

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-PA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

let usuarioId = sessionStorage.getItem("usuario_id");

const likeBtn = document.getElementById("likeBtn");
const likeCount = document.getElementById("likeCount");
let noticia = null;
let noticiaId = null;
// Flag para noticias desactivadas (se puede ver pero no interactuar)
let noticiaDesactivada = false;

const commentForm = document.getElementById("commentForm");
const commentText = document.getElementById("commentText");
const commentCount = document.getElementById("commentCount");

document.addEventListener("DOMContentLoaded", async () => {
    // ── 1. Leer ID desde la URL ──
    const params = new URLSearchParams(window.location.search);
    const idFromUrl = params.get("id");
    if (!idFromUrl) {
        document.getElementById("titulo").innerText = "Noticia no encontrada.";
        return;
    }

    // ── 2. Fetch noticia desde el API ──
    try {
        const res = await fetch(`${API_BASE_URL}/noticia/${idFromUrl}`);
        if (res.ok) {
            noticia = await res.json();
            noticiaId = noticia.id;
        } else if (res.status === 404) {
            document.getElementById("titulo").innerText = "Noticia no encontrada.";
            return;
        } else {
            document.getElementById("titulo").innerText = "Error al cargar la noticia.";
            return;
        }
    } catch (err) {
        console.error("Error fetching noticia:", err);
        document.getElementById("titulo").innerText = "Error de conexión.";
        return;
    }

    // ── 3. Sesión e inicialización ──
    const session = await verificarSesion();
    if (session) {
        usuarioId = String(session.id);
    } else {
        usuarioId = null;
    }

    initNavbar(session);
    cargarVisitas();
    cargarComentarios();

    // ── 4. Renderizar noticia ──
    renderNoticia();

    // ── 5. Likes ──
    if (noticiaId) {
        setupLikes();
    }

    // ── 6. Category dropdown + search ──
    setupNavbarListeners();
});

// ═══════════════════════════════════════════════════════════════
//  RENDER
// ═══════════════════════════════════════════════════════════════

function renderNoticia() {
    document.getElementById("titulo").innerText = noticia.titulo;
    document.getElementById("autor").innerText = noticia.autor;

    // Contenido como párrafos
    const contenidoEl = document.getElementById("contenido");
    if (contenidoEl && noticia.contenido) {
        contenidoEl.innerHTML = noticia.contenido
            .split(/\n\s*\n/)
            .map(p => p.trim())
            .filter(p => p.length > 0)
            .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
            .join('');
    }

    const fecha = new Date(noticia.fecha_creacion || noticia.fecha);
    document.getElementById("fecha_creacion").innerText = fecha.toLocaleDateString("es-ES", {
        year: "numeric", month: "long", day: "numeric"
    });

    // Category badge
    const categoriaBadge = document.getElementById("categoriaBadge");
    if (categoriaBadge) {
        categoriaBadge.textContent = noticia.categoria?.nombre || noticia.categoria || 'General';
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

    // Hero image
    const heroImg = document.getElementById("imagen1");
    if (heroImg) {
        const src = noticia.imagenes?.[0] ? `${API_BASE_URL}/${noticia.imagenes[0].imagen}` : defaultImg;
        heroImg.src = src;
        heroImg.onerror = () => { heroImg.src = defaultImg; };
    }

    // Gallery grid
    const galleryContainer = document.getElementById("imagenesAdicionales");
    if (galleryContainer) {
        const adicionales = noticia.imagenes?.slice(1) || [];
        if (adicionales.length > 0) {
            galleryContainer.innerHTML = adicionales.map(img => `
                <figure class="gallery-figure">
                    <img src="${API_BASE_URL}/${img.imagen}" alt="${img.descripcion || 'Imagen adicional'}" 
                         class="gallery-image" loading="lazy"
                         onerror="this.src='${defaultImg}'" />
                    ${img.descripcion ? `<figcaption class="gallery-caption">${img.descripcion}</figcaption>` : ''}
                </figure>
            `).join('');
            galleryContainer.style.display = '';
        } else {
            galleryContainer.style.display = 'none';
        }
    }
}

// ═══════════════════════════════════════════════════════════════
//  COMENTARIOS
// ═══════════════════════════════════════════════════════════════

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
        }).then(result => { if (result.isConfirmed) window.location.href = "/auth/iniciar-sesion/"; });
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

// ═══════════════════════════════════════════════════════════════
//  LIKES
// ═══════════════════════════════════════════════════════════════

let yaDioLike = false;

function setupLikes() {
    inicializarLikes();

    likeBtn.addEventListener("click", () => {
        if (!usuarioId) {
            Swal.fire({
                icon: "warning", title: "Inicia sesion",
                text: "Debes estar logueado para dar like.",
                confirmButtonColor: "#3085d6", confirmButtonText: "Iniciar sesion",
            }).then(result => { if (result.isConfirmed) window.location.href = "/auth/iniciar-sesion/"; });
            return;
        }
        yaDioLike ? quitarLike() : darLike();
    });
}

async function inicializarLikes() {
    try {
        const resLikes = await fetch(`${API_BASE_URL}/like/${noticiaId}`);
        if (!resLikes.ok) {
            // Noticia desactivada — ocultar botón de like
            if (resLikes.status === 403) {
                likeBtn.style.display = 'none';
                return;
            }
            return;
        }
        const dataLikes = await resLikes.json();
        likeCount.textContent = dataLikes.total_likes || 0;
        if (usuarioId) {
            const resUsuarioLike = await fetch(`${API_BASE_URL}/like/me/${noticiaId}`);
            if (resUsuarioLike.ok) {
                const dataUsuarioLike = await resUsuarioLike.json();
                yaDioLike = dataUsuarioLike.liked || false;
            }
        }
        actualizarBotonLike();
    } catch (err) { console.error("Error al inicializar likes:", err); }
}

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

// ═══════════════════════════════════════════════════════════════
//  NAVEGACIÓN (category + search)
// ═══════════════════════════════════════════════════════════════

function setupNavbarListeners() {
    const categorySelect = document.getElementById("categorySelect");
    if (categorySelect) {
        categorySelect.addEventListener("change", (e) => {
            localStorage.setItem("selectedCategory", e.target.value);
            window.location.href = "/";
        });
    }

    function doSearch() {
        const q = document.getElementById("searchInput");
        if (q && q.value.trim()) {
            localStorage.setItem("searchQuery", q.value.trim());
            window.location.href = "/";
        }
    }
    const searchBtn = document.getElementById("searchBtn");
    if (searchBtn) searchBtn.addEventListener("click", doSearch);
    const searchInput = document.getElementById("searchInput");
    if (searchInput) searchInput.addEventListener("keyup", (e) => {
        if (e.key === "Enter") doSearch();
    });
}
