// Variables globales
let currentPage = 1;
const initialNewsCount = 5;
const newsPerPage = 6;
let currentCategory = "todas";
let allNews = [];
let usuario = sessionStorage.getItem("usuario");

// Función de inicialización
document.addEventListener("DOMContentLoaded", async () => {
    await verificarSesion();
    await actualizarVisitas();
    await cargarNoticias();

    // Eventos
    document.getElementById("loadMore").addEventListener("click", loadMoreNews);
    document.querySelector(".main-nav").addEventListener("click", (e) => {
        if (e.target.tagName === "A") {
            e.preventDefault();
            currentCategory = e.target.dataset.category === "todas" ? "todas" : parseInt(e.target.dataset.category);
            document.getElementById("newsGrid").innerHTML = "";
            currentPage = 1;
            loadFilteredNews();
        }
    });

    document.getElementById("logoutBtn").addEventListener("click", logout);
});

// Verificar sesión y mostrar botones según rol
async function verificarSesion() {
    const access_token = sessionStorage.getItem("access_token");
    if (!access_token) return;

    try {
        const res = await fetch("http://127.0.0.1:8000/auth/session", {
            headers: { Authorization: `Bearer ${access_token}` },
        });
        const data = await res.json();

        if (data.success) {
            sessionStorage.setItem("usuario_id", data.usuario_id);
            sessionStorage.setItem("rol", data.rol);
            usuario = data.usuario;

            // Mostrar nombre de usuario
            const usernameDisplay = document.getElementById("usernameDisplay");
            if (usernameDisplay) usernameDisplay.textContent = `Hola, ${usuario}`;

            document.querySelector(".user-info").style.display = "flex";
            document.querySelector(".nav-auth").style.display = "none";
            document.getElementById("logoutBtn").style.display = "block";

            // Botones según rol
            mostrarBotonesPorRol(data.rol);
        } else {
            document.querySelector(".user-info").style.display = "none";
            document.querySelector(".nav-auth").style.display = "flex";
        }
    } catch (error) {
        console.error("Error al verificar sesión:", error);
    }
}

function mostrarBotonesPorRol(rol) {
    const perfilBtn = document.getElementById("btn-editar");
    if (perfilBtn) perfilBtn.style.display = "inline-block";

    if (["admin"].includes(rol)) {
        const adminBtn = document.getElementById("adminBtn");
        if (adminBtn) adminBtn.style.display = "inline-block";
    }

    if (["admin", "supervisor", "editor"].includes(rol)) {
        const supervisorBtn = document.getElementById("supervisorPanelBtn");
        if (supervisorBtn) supervisorBtn.style.display = "inline-block";

        const publicarBtn = document.getElementById("publicarBtn");
        if (publicarBtn) publicarBtn.style.display = "inline-block";
    }
}

// Cerrar sesión
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
            document.querySelector(".user-info").style.display = "none";
            document.querySelector(".nav-auth").style.display = "flex";
            Swal.fire({
                icon: "success",
                title: "Sesión cerrada",
                text: "Has cerrado sesión correctamente.",
                timer: 2000,
                showConfirmButton: false,
            }).then(() => {
                window.location.href = "../index.php";
            });
        }
    });
}

// Actualizar visitas
async function actualizarVisitas() {
    try {
        // Incrementar visitas usando PUT
        await fetch("http://127.0.0.1:8000/vistas/update", { method: "PUT" });

        // Obtener total de visitas
        const res = await fetch("http://127.0.0.1:8000/vistas/", { method: "GET" });
        const data = await res.json();
        const visitorCountEl = document.getElementById("visitorCount");
        if (visitorCountEl) {
            visitorCountEl.textContent = `${data.cantidad} visitas`;
        }
    } catch (error) {
        console.error("Error al actualizar visitas:", error);
    }
}

// Cargar todas las noticias
async function cargarNoticias() {
    try {
        const res = await fetch("http://127.0.0.1:8000/noticia/");
        allNews = await res.json();
        loadFilteredNews();
    } catch (error) {
        console.error("Error al cargar noticias:", error);
    }
}

// Filtrar y renderizar noticias
function loadFilteredNews() {
    const filteredNews =
        currentCategory === "todas"
            ? allNews.filter((n) => n.activo)
            : allNews.filter((n) => n.categoria_id === currentCategory && n.activo);

    const sortedNews = filteredNews.sort(
        (a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion)
    );

    if (sortedNews.length === 0) {
        document.getElementById("wrapper").style.minHeight = "100vh";
        document.getElementById("newsGrid").innerHTML =
            "<p style='text-align: center; font-size: 18px; color: #2c3e50;'>No hay noticias para esta categoría.</p>";
        document.getElementById("loadMore").style.display = "none";
    } else {
        document.getElementById("wrapper").style.minHeight = "";
        renderNews(sortedNews.slice(0, initialNewsCount));
        document.getElementById("loadMore").style.display =
            sortedNews.length > initialNewsCount ? "block" : "none";
    }
}

// Cargar más noticias
function loadMoreNews() {
    const startIndex = document.querySelectorAll(".news-card").length;

    const filteredNews =
        currentCategory === "todas"
            ? allNews.filter((n) => n.activo)
            : allNews.filter((n) => n.categoria_id === currentCategory && n.activo);

    const nextNews = filteredNews.slice(startIndex, startIndex + newsPerPage);

    if (nextNews.length > 0) renderNews(nextNews);

    if (startIndex + nextNews.length >= filteredNews.length)
        document.getElementById("loadMore").style.display = "none";
}

// Renderizar noticias según estructura HTML original
function renderNews(news) {
    const newsGrid = document.getElementById("newsGrid");

    if (document.querySelectorAll(".news-card").length === 0) {
        if (news.length > 0) newsGrid.appendChild(createFeaturedNewsCard(news[0], "main-news"));

        if (news.length > 1) {
            const secondaryContainer = document.createElement("div");
            secondaryContainer.className = "secondary-news";
            news.slice(1, 3).forEach((article) => {
                secondaryContainer.appendChild(createFeaturedNewsCard(article, "secondary-news-card"));
            });
            newsGrid.appendChild(secondaryContainer);
        }

        if (news.length > 3) {
            const extraContainer = document.createElement("div");
            extraContainer.className = "secondary-news";
            news.slice(3).forEach((article) => {
                extraContainer.appendChild(createFeaturedNewsCard(article, "secondary-news-card"));
            });
            newsGrid.appendChild(extraContainer);
        }
    } else {
        const moreContainer = document.createElement("div");
        moreContainer.className = "secondary-news";
        news.forEach((article) => {
            moreContainer.appendChild(createFeaturedNewsCard(article, "secondary-news-card"));
        });
        newsGrid.appendChild(moreContainer);
    }
}

// Crear tarjeta de noticia
function createFeaturedNewsCard(article, className) {
    const card = document.createElement("a");
    card.className = `news-card ${className}`;
    card.href = "#";
    card.addEventListener("click", () => {
        localStorage.setItem("noticia", JSON.stringify(article));
        window.location.href = "../app/detalle-noticia/";
    });

    // Seleccionar imagen: si no hay, usar default
    let imageUrl = "../imagenDB/DEFAULT.PNG";
    if (article.imagenes && article.imagenes.length > 0 && article.imagenes[0].imagen) {
        imageUrl = article.imagenes[0].imagen;
    }

    card.innerHTML = `
        <img src="${imageUrl}" 
             alt="${article.titulo}" 
             class="news-image"
             onerror="this.onerror=null; this.src='../imagenDB/DEFAULT.PNG'">
        <div class="news-content">
            <h3 class="news-title">${article.titulo}</h3>
            <p class="news-excerpt">${article.contenido.substring(0, className === "main-news" ? 500 : 100)}...</p>
            <div class="news-meta">
                <span><strong>Autor:</strong> ${article.autor}</span>
                <span>${new Date(article.fecha_creacion).toLocaleDateString()}</span>
            </div>
        </div>
    `;
    return card;
}
