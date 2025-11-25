import { API_BASE_URL } from "/config/config.js";

const apiBaseUrl = `${API_BASE_URL}/usuarios`;

let access_token = sessionStorage.getItem("access_token");

// ==============================
// 🔹 Verificar sesión y obtener datos
// ==============================
async function verificarSesionYObtenerDatos() {
  if (!access_token) {
    Swal.fire({
      icon: "error",
      title: "Sesión no válida",
      text: "Debes iniciar sesión para acceder.",
      confirmButtonText: "Ir al inicio",
    }).then(() => {
      window.location.href = "../index.html";
    });
    return false;
  }

  try {
    const res = await fetch(`${apiBaseUrl}/me`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!res.ok) throw new Error("Sesión no válida");

    const usuario = await res.json();

    // Mostrar datos en los campos
    document.querySelector('input[name="nombre"]').value = usuario.nombre;
    document.querySelector('input[name="apellido"]').value = usuario.apellido;
    document.querySelector('input[name="usuario"]').value = usuario.usuario;

    return true;
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Sesión no válida",
      text: "Debes iniciar sesión para acceder.",
      confirmButtonText: "Ir al inicio",
    }).then(() => {
      window.location.href = "../index.html";
    });
    return false;
  }
}

// ==============================
// 🔹 Habilitar edición
// ==============================
document.getElementById("btnEditar").addEventListener("click", () => {
  document
    .querySelectorAll('input[name="nombre"], input[name="apellido"], input[name="usuario"]')
    .forEach((input) => input.removeAttribute("disabled"));

  document.getElementById("btnGuardar").style.display = "inline-block";
  document.getElementById("btnEditar").style.display = "none";
});

// ==============================
// 🔹 Guardar cambios
// ==============================
document.getElementById("formEditarSesion").addEventListener("submit", async function (e) {
  e.preventDefault();

  const nombre = document.querySelector('input[name="nombre"]').value.trim();
  const apellido = document.querySelector('input[name="apellido"]').value.trim();
  const usuario = document.querySelector('input[name="usuario"]').value.trim();

  if (!nombre || !apellido || !usuario) {
    Swal.fire({
      icon: "warning",
      title: "Campos incompletos",
      text: "Por favor, completa todos los campos.",
    });
    return;
  }

  const confirm = await Swal.fire({
    icon: "question",
    title: "¿Guardar cambios?",
    text: "Se actualizará tu información personal.",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Sí, guardar",
    cancelButtonText: "Cancelar",
  });

  if (!confirm.isConfirmed) return;

  try {
    const res = await fetch(`${apiBaseUrl}/me`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({ nombre, apellido, usuario }),
    });

    const result = await res.json();

    if (res.ok) {
      Swal.fire({
        icon: "success",
        title: "Actualizado correctamente",
        text: "Tus datos han sido modificados.",
        timer: 2000,
        showConfirmButton: false,
      });

      // Deshabilitar campos y restaurar botones
      document
        .querySelectorAll('input[name="nombre"], input[name="apellido"], input[name="usuario"]')
        .forEach((input) => input.setAttribute("disabled", true));

      document.getElementById("btnGuardar").style.display = "none";
      document.getElementById("btnEditar").style.display = "inline-block";
    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: result.detail || "No se pudo actualizar el usuario.",
      });
    }
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Error de red",
      text: `No se pudo conectar al servidor. Detalle: ${error.message}`,
    });
  }
});

// ==============================
// 🔹 Al cargar la página
// ==============================
(async function () {
  await verificarSesionYObtenerDatos();
})();
