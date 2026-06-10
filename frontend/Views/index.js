import { API_BASE_URL } from "/config/config.js";
import { verificarSesion, cerrarSesion } from "/js/auth.js";

let currentPage = 1;
let totalPages = 1;
let currentCategory = "todas";

document.addEventListener("DOMContentLoaded", async () => {
    // Restore category from localStorage (set by detalle-noticia dropdown)
    const savedCategory = localStorage.getItem("selectedCategory");
    if (savedCategory) {
        currentCategory = savedCategory;
        document.getElementById("categorySelect").value = savedCategory;
        localStorage.removeItem("selectedCategory");
    }

    const data = await verificarSesion();
    if (data) {
        mostrarBotonesPorRol(data.rol);
        const usernameDisplay = document.getElementById("usernameDisplay");
        if (usernameDisplay) usernameDisplay.textContent = `Hola, ${data.usuario}`;
        document.getElementById("navbarUser").classList.add("show");
        document.getElementById("navbarAuth").style.display = "none";
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

    document.getElementById("categorySelect").addEventListener("change", (e) => {
        currentCategory = e.target.value;
        document.getElementById("heroSection")?.remove();
        document.getElementById("featureGrid")?.remove();
        document.getElementById("newsGrid").innerHTML = "";
        currentPage = 1;
        cargarNoticias();
    });

    document.getElementById("logoutBtn").addEventListener("click", cerrarSesion);

    // Hamburger toggle
    const hamburger = document.getElementById("hamburgerBtn");
    const navbarMenu = document.getElementById("navbarMenu");
    if (hamburger && navbarMenu) {
        hamburger.addEventListener("click", () => {
            hamburger.classList.toggle("active");
            navbarMenu.classList.toggle("active");
        });
    }
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
// Helper: Obtener URL de imagen
// ==============================
function getImageUrl(noticia) {
    if (noticia.imagen1) return noticia.imagen1;
    if (noticia.imagenes && noticia.imagenes.length > 0 && noticia.imagenes[0].imagen) {
        return `${API_BASE_URL}/${noticia.imagenes[0].imagen}`;
    }
    return 'data:image/svg+xml,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="225" viewBox="0 0 400 225">' +
        '<rect fill="#E5E7EB" width="400" height="225"/>' +
        '<text fill="#9CA3AF" font-family="Arial,sans-serif" font-size="14" text-anchor="middle" x="200" y="118">Sin imagen</text>' +
        '</svg>'
    );
}

// ==============================
// Helper: Formatear fecha
// ==============================
function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-PA', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ==============================
// Render: Hero Section (first news item)
// ==============================
function renderHero(noticia) {
    const heroSection = document.getElementById('heroSection') || createHeroSection();
    const categoria = noticia.categoria.nombre|| noticia.categoria || 'General';

    heroSection.innerHTML = `
    <div class="hero-card" onclick="window.location.href='detalle-noticia/index.html?id=${noticia.id}'">
      <div class="news-card-image">
        <img src="${getImageUrl(noticia)}" alt="${noticia.titulo}" loading="lazy">
        <span class="category-badge">${categoria}</span>
      </div>
      <div class="hero-overlay">
        <h1 class="hero-title">${noticia.titulo}</h1>
        <p class="hero-excerpt">${noticia.descripcion_corta || (noticia.contenido ? noticia.contenido.substring(0, 150) : '')}...</p>
        <div class="hero-meta">
          <span><i class="far fa-user"></i> ${noticia.autor || 'Redacción'}</span>
          <span><i class="far fa-calendar-alt"></i> ${formatDate(noticia.fecha_creacion)}</span>
          <span><i class="far fa-comment"></i> ${noticia.comentarios_count || 0}</span>
        </div>
      </div>
    </div>
  `;
}

function createHeroSection() {
    const container = document.querySelector('.home-container');
    const section = document.createElement('section');
    section.id = 'heroSection';
    section.className = 'hero-section';
    container.insertBefore(section, container.querySelector('.feature-grid') || container.querySelector('.section-header'));
    return section;
}

// ==============================
// Render: Feature Grid (2nd and 3rd news items)
// ==============================
function renderFeatures(noticias) {
    const grid = document.getElementById('featureGrid') || createFeatureGrid();
    grid.innerHTML = noticias.map(n => {
        const categoria = n.categoria.nombre || n.categoria || 'General';
        return `
      <div class="feature-card" onclick="window.location.href='detalle-noticia/index.html?id=${n.id}'">
        <div class="news-card-image">
          <img src="${getImageUrl(n)}" alt="${n.titulo}" loading="lazy">
        </div>
        <div class="feature-card-body">
          <span class="category-badge">${categoria}</span>
          <h2 class="feature-card-title">${n.titulo}</h2>
          <p class="feature-card-excerpt">${n.descripcion_corta || (n.contenido ? n.contenido.substring(0, 120) : '')}...</p>
          <div class="feature-card-meta">
            <span><i class="far fa-user"></i> ${n.autor || 'Redacción'}</span>
            <span><i class="far fa-calendar-alt"></i> ${formatDate(n.fecha_creacion)}</span>
          </div>
        </div>
      </div>
    `;
    }).join('');
}

function createFeatureGrid() {
    const container = document.querySelector('.home-container');
    const section = document.createElement('div');
    section.id = 'featureGrid';
    section.className = 'feature-grid';
    container.insertBefore(section, container.querySelector('.section-header') || container.querySelector('.news-grid'));
    return section;
}

// ==============================
// Render: Single News Card (for the grid)
// ==============================
function renderNewsCard(noticia) {
    const categoria = noticia.categoria.nombre || noticia.categoria || 'General';
    return `
    <article class="news-card" onclick="window.location.href='detalle-noticia/index.html?id=${noticia.id}'">
      <div class="news-card-image">
        <img src="${getImageUrl(noticia)}" alt="${noticia.titulo}" loading="lazy">
        <span class="category-badge">${categoria}</span>
      </div>
      <div class="news-card-body">
        <h3 class="news-card-title">${noticia.titulo}</h3>
        <p class="news-card-excerpt">${noticia.descripcion_corta || (noticia.contenido ? noticia.contenido.substring(0, 100) : '')}...</p>
        <div class="news-card-meta">
          <span><i class="far fa-user"></i> ${noticia.autor || 'Redacción'}</span>
          <span><i class="far fa-calendar-alt"></i> ${formatDate(noticia.fecha_creacion)}</span>
          <span><i class="far fa-comment"></i> ${noticia.comentarios_count || 0}</span>
        </div>
      </div>
    </article>
  `;
}

// ==============================
// Render: News Grid (4+ items or append)
// ==============================
function renderNewsGrid(noticias, append = false) {
    const grid = document.getElementById('newsGrid');
    if (!append) grid.innerHTML = '';
    grid.innerHTML += noticias.map(n => renderNewsCard(n)).join('');
}

// ==============================
// Cargar noticias (con filtro)
// ==============================
async function cargarNoticias() {
    iniciarSkeleton();
    try {
        const res = await fetch(
            `${API_BASE_URL}/noticia/?filtro=${encodeURIComponent(currentCategory)}&page=${currentPage}&size=10`
        );

        const data = await res.json();
        console.log(data.noticias)
        totalPages = data.total_pages;
        const noticias = data.noticias || [];

        if (noticias.length === 0 && currentPage === 1) {
            ocultarSkeleton();
            // Clear hero and features
            document.getElementById('heroSection')?.remove();
            document.getElementById('featureGrid')?.remove();
            const grid = document.getElementById('newsGrid');
            grid.innerHTML = '';
            const msg = document.createElement('p');
            msg.style.cssText = "text-align:center;font-size:18px;color:#2c3e50;";
            msg.textContent = "No hay noticias disponibles.";
            grid.appendChild(msg);
            document.getElementById('loadMore').style.display = "none";
            return;
        }

        if (currentPage === 1) {
            // Full render: hero + features + grid
            if (noticias.length >= 1) renderHero(noticias[0]);
            if (noticias.length >= 2) {
                renderFeatures(noticias.slice(1, Math.min(3, noticias.length)));
            }
            if (noticias.length > 3) {
                renderNewsGrid(noticias.slice(3), false);
            }
        } else {
            // Append mode (load more)
            renderNewsGrid(noticias, true);
        }

        document.getElementById('loadMore').style.display =
            currentPage < totalPages ? "block" : "none";
    } catch (error) {
        console.error("Error al cargar noticias:", error);
        ocultarSkeleton();
        // Clear hero and features on error
        document.getElementById('heroSection')?.remove();
        document.getElementById('featureGrid')?.remove();
        const grid = document.getElementById('newsGrid');
        if (grid) {
            grid.innerHTML = `
                <div class="error-state">
                    <div class="error-state-icon"><i class="fas fa-exclamation-circle"></i></div>
                    <h3>Error al cargar noticias</h3>
                    <p>${error.message || "Intenta de nuevo más tarde"}</p>
                    <button class="error-retry-btn" onclick="cargarNoticias()">
                        <i class="fas fa-redo"></i> Reintentar
                    </button>
                </div>
            `;
        }
    } finally {
        ocultarSkeleton();
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
// Skeleton loading helpers
// ==============================
let skeletonTimer = null;

function mostrarSkeleton() {
    // Handled by iniciarSkeleton timer in cargarNoticias
}

function iniciarSkeleton() {
    if (skeletonTimer) clearTimeout(skeletonTimer);
    skeletonTimer = setTimeout(() => {
        const grid = document.getElementById('newsGrid');
        if (!grid) return;
        // Only show skeleton if grid is empty (initial load, not load-more)
        if (grid.children.length > 0) return;

        // Remove existing skeletons
        document.getElementById('newsGrid-skeleton')?.remove();
        document.getElementById('heroSkeleton')?.remove();

        // Hero skeleton (only on page 1)
        if (currentPage === 1) {
            const container = document.querySelector('.home-container');
            const heroSkeleton = document.createElement('div');
            heroSkeleton.id = 'heroSkeleton';
            heroSkeleton.className = 'skeleton skeleton-hero';
            container.insertBefore(heroSkeleton, container.querySelector('.section-header'));
        }

        // Grid skeleton
        const skeletonContainer = document.createElement('div');
        skeletonContainer.id = 'newsGrid-skeleton';
        skeletonContainer.className = 'skeleton-grid';

        for (let i = 0; i < 6; i++) {
            const card = document.createElement('div');
            card.className = 'skeleton skeleton-card';
            skeletonContainer.appendChild(card);
        }

        grid.parentNode.insertBefore(skeletonContainer, grid);
        grid.style.display = 'none';
    }, 300);
}

function ocultarSkeleton() {
    if (skeletonTimer) {
        clearTimeout(skeletonTimer);
        skeletonTimer = null;
    }
    const heroSkeleton = document.getElementById('heroSkeleton');
    if (heroSkeleton) heroSkeleton.remove();

    const skeleton = document.getElementById('newsGrid-skeleton');
    if (skeleton) skeleton.remove();

    const grid = document.getElementById('newsGrid');
    if (grid) grid.style.display = '';
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

        const grid = document.getElementById('newsGrid');
        grid.innerHTML = ''; // limpiar grid

        // Hide hero and features when showing search results
        document.getElementById('heroSection')?.remove();
        document.getElementById('featureGrid')?.remove();

        if (noticias.length === 0) {
            const msg = document.createElement('p');
            msg.style.cssText = "text-align:center;font-size:18px;color:#2c3e50;";
            msg.textContent = `No se encontraron noticias para "${query}".`;
            grid.appendChild(msg);
            document.getElementById('loadMore').style.display = "none";
            return;
        }

        // Render search results using the new card template
        grid.innerHTML = noticias.map(n => renderNewsCard(n)).join('');
        document.getElementById('loadMore').style.display = "none";

    } catch (error) {
        console.error("Error en buscarNoticias:", error);
    }
}
