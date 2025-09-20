// Variables globales
let currentPage = 1;
let totalPages = 1;
let currentCategory = "todas";
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
            cargarNoticias();
        }
    });

    document.getElementById("logoutBtn").addEventListener("click", logout);
});

// Verificar sesión y mostrar botones según rol
async function verificarSesion() {
    const access_token = sessionStorage.getItem("access_token");
    if (!access_token) return;

    try {
        const res = await fetch("http://127.0.0.1:8000/usuarios/me", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${access_token}`,
                "Content-Type": "application/json",
            },
        });

        if (!res.ok) {
            sessionStorage.clear();
            document.querySelector(".user-info").style.display = "none";
            document.querySelector(".nav-auth").style.display = "flex";
            return;
        }

        const data = await res.json();
        sessionStorage.setItem("usuario_id", data.id);
        sessionStorage.setItem("rol", data.rol);
        sessionStorage.setItem("usuario", data.usuario);

        const usernameDisplay = document.getElementById("usernameDisplay");
        if (usernameDisplay) usernameDisplay.textContent = `Hola, ${data.usuario}`;

        document.querySelector(".user-info").style.display = "flex";
        document.querySelector(".nav-auth").style.display = "none";
        document.getElementById("logoutBtn").style.display = "block";

        mostrarBotonesPorRol(data.rol);

    } catch (error) {
        console.error("Error al verificar sesión:", error);
    }
}

function mostrarBotonesPorRol(rol) {
    // Limpiar listeners existentes
    const botones = ["btn-editar", "adminBtn", "supervisorPanelBtn", "publicarBtn"];
    botones.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.style.display = "none";
            btn.replaceWith(btn.cloneNode(true)); // limpia event listeners previos
        }
    });

    // Botón de perfil
    const perfilBtn = document.getElementById("btn-editar");
    if (perfilBtn) {
        perfilBtn.style.display = "inline-block";
        perfilBtn.addEventListener("click", () => {
            window.location.href = "editar-usuario/index.html";
        });
    }

    // Botón admin
    if (["admin"].includes(rol)) {
        const adminBtn = document.getElementById("adminBtn");
        if (adminBtn) {
            adminBtn.style.display = "inline-block";
            adminBtn.addEventListener("click", () => {
                window.location.href = "administrar-usuario/index.html";
            });
        }
    }

    // Botones supervisor/editor
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
                window.location.href = "index.html";
            });
        }
    });
}

// Actualizar visitas
async function actualizarVisitas() {
    try {
        await fetch("http://127.0.0.1:8000/vistas/update", { method: "PUT" });
        const res = await fetch("http://127.0.0.1:8000/vistas/", { method: "GET" });
        const data = await res.json();
        const visitorCountEl = document.getElementById("visitorCount");
        if (visitorCountEl) visitorCountEl.textContent = `${data.cantidad} visitas`;
    } catch (error) {
        console.error("Error al actualizar visitas:", error);
    }
}

// Cargar noticias
async function cargarNoticias() {
    try {
        const res = await fetch(`http://127.0.0.1:8000/noticia/?page=${currentPage}&size=10`);
        const data = await res.json();

        totalPages = data.total_pages;
        const noticias = data.noticias || [];

        if (noticias.length === 0 && currentPage === 1) {
            document.getElementById("wrapper").style.minHeight = "100vh";
            document.getElementById("newsGrid").innerHTML =
                "<p style='text-align: center; font-size: 18px; color: #2c3e50;'>No hay noticias disponibles.</p>";
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

// Cargar más noticias
async function loadMoreNews() {
    if (currentPage < totalPages) {
        currentPage++;
        await cargarNoticias();
    }
}

// Renderizar noticias
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

// Crear tarjeta de noticia
function createFeaturedNewsCard(article, className) {
    const card = document.createElement("a");
    card.className = `news-card ${className}`;
    card.href = "#";
    card.addEventListener("click", () => {
        localStorage.setItem("noticia", JSON.stringify(article));
        window.location.href = "detalle-noticia/index.html";
    });

    let imageUrl = "../src/imagenesDB/DEFAULT.png";
    if (article.imagenes && article.imagenes.length > 0 && article.imagenes[0].imagen) {
        imageUrl = article.imagenes[0].imagen;
    }

    card.innerHTML = `
        <img src="../src/${imageUrl}" 
             alt="${article.titulo}" 
             class="news-image"
             onerror="this.onerror=null; this.src='../src/imagenesDB/DEFAULT.png';">
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
