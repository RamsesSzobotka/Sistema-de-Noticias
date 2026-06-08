import { API_BASE_URL } from "/config/config.js";
import { verificarSesion, cerrarSesion } from "./auth/auth.js";

let currentPage = 1;
let totalPages = 1;
let currentCategory = "todas";

document.addEventListener("DOMContentLoaded", async () => {
    const data = await verificarSesion();
    if (data) {
        mostrarBotonesPorRol(data.rol);
        const usernameDisplay = document.getElementById("usernameDisplay");
        if (usernameDisplay) usernameDisplay.textContent = `Hola, ${data.usuario}`;
        document.querySelector(".user-info").style.display = "flex";
        document.querySelector(".nav-auth").style.display = "none";
        document.getElementById("logoutBtn").style.display = "block";
    } else {
        mostrarBotonesPorRol(null);
    }
    await actualizarVisitas();
    await cargarNoticias();

    document.getElementById("searchBtn").addEventListener("click", () => {
        const query = document.getElementById("searchInput").value.trim();
        if (query) buscarNoticias(query);
    });

    document.getElementById("searchInput").addEventListener("keyup", (e) => {
        if (e.key === "Enter") {
            const query = e.target.value.trim();
            if (query) buscarNoticias(query);
        }
    });

    document.getElementById("loadMore").addEventListener("click", loadMoreNews);

    document.querySelector(".main-nav").addEventListener("click", (e) => {
        if (e.target.tagName === "A") {
            e.preventDefault();
            currentCategory = e.target.dataset.category.toLowerCase();
            document.getElementById("newsGrid").innerHTML = "";
            currentPage = 1;
            cargarNoticias();
        }
    });

    document.getElementById("logoutBtn").addEventListener("click", cerrarSesion);
});

// ==============================
// Mostrar botones por rol (por ID para evitar conflictos CSS)
// ==============================
function mostrarBotonesPorRol(rol) {
    // Ocultar todos primero
    ["btn-editar", "adminBtn", "supervisorPanelBtn", "publicarBtn"].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.style.display = "none";
            btn.replaceWith(btn.cloneNode(true));
        }
    });

    if (!rol) return;

    // Perfil: visible para cualquier autenticado
    const perfilBtn = document.getElementById("btn-editar");
    if (perfilBtn) {
        perfilBtn.style.display = "inline-block";
        perfilBtn.addEventListener("click", () => {
            window.location.href = "editar-usuario/index.html";
        });
    }

    // Admin: solo admin
    if (rol === "admin") {
        const adminBtn = document.getElementById("adminBtn");
        if (adminBtn) {
            adminBtn.style.display = "inline-block";
            adminBtn.addEventListener("click", () => {
                window.location.href = "administrar-usuario/index.html";
            });
        }
    }

    // Editor+ (admin, supervisor, editor): panel y publicar
    if (["admin", "supervisor", "editor"].includes(rol)) {
        const supervisorBtn = document.getElementById("supervisorPanelBtn");
        if (supervisorBtn) {
            supervisorBtn.style.display = "inline-block";
            supervisorBtn.addEventListener("click", () => {
                window.location.href = "administrar-noticia/index.html";
            });
        }

        const publicarBtn = document.getElementById("publicarBtn");
        if (publicarBtn) {
            publicarBtn.style.display = "inline-block";
            publicarBtn.addEventListener("click", () => {
                window.location.href = "crear-noticia/index.html";
            });
        }
    }
}



// ==============================
// Actualizar visitas
// ==============================
async function actualizarVisitas() {
    try {
        await fetch(`${API_BASE_URL}/vistas/update`, { method: "PUT" });
        const res = await fetch(`${API_BASE_URL}/vistas/`, { method: "GET" });
        const data = await res.json();
        const visitorCountEl = document.getElementById("visitorCount");
        if (visitorCountEl) visitorCountEl.textContent = `${data.cantidad} visitas`;
    } catch (error) {
        console.error("Error al actualizar visitas:", error);
    }
}

// ==============================
// Cargar noticias (con filtro)
// ==============================
async function cargarNoticias() {
    try {
        // 🟢 Se incluye el parámetro "filtro" en la URL
        const res = await fetch(
            `${API_BASE_URL}/noticia/?filtro=${encodeURIComponent(currentCategory)}&page=${currentPage}&size=10`
        );

        const data = await res.json();

        totalPages = data.total_pages;
        const noticias = data.noticias || [];

        if (noticias.length === 0 && currentPage === 1) {
            document.getElementById("wrapper").style.minHeight = "100vh";
            const grid = document.getElementById("newsGrid");
            grid.innerHTML = "";
            const msg = document.createElement("p");
            msg.style.cssText = "text-align:center;font-size:18px;color:#2c3e50;";
            msg.textContent = "No hay noticias disponibles.";
            grid.appendChild(msg);
            document.getElementById("loadMore").style.display = "none";
            return;
        }

        renderNews(noticias);
        document.getElementById("loadMore").style.display =
            currentPage < totalPages ? "block" : "none";
    } catch (error) {
        console.error("Error al cargar noticias:", error);
    }
}

// ==============================
// Cargar más noticias
// ==============================
async function loadMoreNews() {
    if (currentPage < totalPages) {
        currentPage++;
        await cargarNoticias();
    }
}

// ==============================
// Renderizar noticias
// ==============================
function renderNews(noticias) {
    const newsGrid = document.getElementById("newsGrid");

    noticias.forEach((article, index) => {
        const card = createFeaturedNewsCard(article, "secondary-news-card");
        if (currentPage === 1 && index === 0 && newsGrid.querySelectorAll(".news-card").length === 0) {
            newsGrid.appendChild(createFeaturedNewsCard(article, "main-news"));
        } else {
            let container = newsGrid.lastElementChild;
            if (!container || !container.classList.contains("secondary-news")) {
                container = document.createElement("div");
                container.className = "secondary-news";
                newsGrid.appendChild(container);
            }
            container.appendChild(card);
        }
    });
}

// ==============================
// Crear tarjeta de noticia
// ==============================
function createFeaturedNewsCard(article, className) {
    const card = document.createElement("a");
    card.className = `news-card ${className}`;
    card.href = "#";
    card.addEventListener("click", () => {
        localStorage.setItem("noticia", JSON.stringify(article));
        window.location.href = "detalle-noticia/index.html";
    });

    let imageUrl = `${API_BASE_URL}/static/imagenesdb/defaultT.png`;
    if (article.imagenes && article.imagenes.length > 0 && article.imagenes[0].imagen) {
        imageUrl = `${API_BASE_URL}/${article.imagenes[0].imagen}`;
    }

    const img = document.createElement("img");
    img.className = "news-image";
    img.alt = article.titulo;
    img.src = imageUrl;
    img.onerror = function () { this.src = `${API_BASE_URL}/static/imagenesdb/default.png`; };
    card.appendChild(img);

    const content = document.createElement("div");
    content.className = "news-content";

    const title = document.createElement("h3");
    title.className = "news-title";
    title.textContent = article.titulo;
    content.appendChild(title);

    const excerpt = document.createElement("p");
    excerpt.className = "news-excerpt";
    excerpt.textContent = article.contenido.substring(0, className === "main-news" ? 500 : 100) + "...";
    content.appendChild(excerpt);

    const meta = document.createElement("div");
    meta.className = "news-meta";

    const author = document.createElement("span");
    const authorStrong = document.createElement("strong");
    authorStrong.textContent = "Autor: ";
    author.appendChild(authorStrong);
    author.append(article.autor);
    meta.appendChild(author);

    const date = document.createElement("span");
    date.textContent = new Date(article.fecha_creacion).toLocaleDateString();
    meta.appendChild(date);

    content.appendChild(meta);
    card.appendChild(content);

    return card;
}

// ==============================
// Buscar noticias con el endpoint /noticia/buscar
// ==============================
async function buscarNoticias(query) {
    try {
        const res = await fetch(
            `${API_BASE_URL}/noticia/buscar?query=${encodeURIComponent(query)}&page=1&size=10`
        );

        if (!res.ok) {
            console.error("Error en búsqueda");
            return;
        }

        const data = await res.json();
        const noticias = data.noticias || [];

        const grid = document.getElementById("newsGrid");
        grid.innerHTML = ""; // limpiar grid

        if (noticias.length === 0) {
            grid.innerHTML = "";
            const msg = document.createElement("p");
            msg.style.cssText = "text-align:center;font-size:18px;color:#2c3e50;";
            msg.textContent = `No se encontraron noticias para "${query}".`;
            grid.appendChild(msg);
            document.getElementById("loadMore").style.display = "none";
            return;
        }

        // 🟩 Crear contenedor igual que en renderNews()
        const container = document.createElement("div");
        container.className = "secondary-news";
        grid.appendChild(container);

        // 🟧 Renderizar cards
        noticias.forEach((article) => {
            const card = createFeaturedNewsCard(article, "secondary-news-card");
            container.appendChild(card);
        });

        // 🟦 Ocultar botón "Cargar más" mientras se está buscando
        document.getElementById("loadMore").style.display = "none";

    } catch (error) {
        console.error("Error en buscarNoticias:", error);
    }
}
