import { API_BASE_URL } from "/config/config.js";

const apiBaseUrl = `${API_BASE_URL}/usuarios`;

async function verificarSesionYObtenerDatos() {
  try {
    const res = await fetch(`${apiBaseUrl}/me`);
    if (!res.ok) throw new Error("Sesion no valida");
    const usuario = await res.json();
    document.querySelector('input[name="nombre"]').value = usuario.nombre;
    document.querySelector('input[name="apellido"]').value = usuario.apellido;
    document.querySelector('input[name="usuario"]').value = usuario.usuario;
    return true;
  } catch (error) {
    Swal.fire({ icon: "error", title: "Sesion no valida", text: "Debes iniciar sesion para acceder.", confirmButtonText: "Ir al inicio" })
      .then(() => window.location.href = "../index.html");
    return false;
  }
}

document.getElementById("btnEditar").addEventListener("click", () => {
  document.querySelectorAll('input[name="nombre"], input[name="apellido"], input[name="usuario"]')
    .forEach(input => input.removeAttribute("disabled"));
  document.getElementById("btnGuardar").style.display = "inline-block";
  document.getElementById("btnEditar").style.display = "none";
});

document.getElementById("formEditarSesion").addEventListener("submit", async function (e) {
  e.preventDefault();
  const nombre = document.querySelector('input[name="nombre"]').value.trim();
  const apellido = document.querySelector('input[name="apellido"]').value.trim();
  const usuario = document.querySelector('input[name="usuario"]').value.trim();
  if (!nombre || !apellido || !usuario) {
    Swal.fire({ icon: "warning", title: "Campos incompletos", text: "Por favor, completa todos los campos." });
    return;
  }
  const confirm = await Swal.fire({
    icon: "question", title: "Guardar cambios?", text: "Se actualizara tu informacion personal.",
    showCancelButton: true, confirmButtonColor: "#3085d6", cancelButtonColor: "#d33",
    confirmButtonText: "Si, guardar", cancelButtonText: "Cancelar",
  });
  if (!confirm.isConfirmed) return;
  try {
    const res = await fetch(`${apiBaseUrl}/me`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, apellido, usuario }),
    });
    const result = await res.json();
    if (res.ok) {
      Swal.fire({ icon: "success", title: "Actualizado correctamente", text: "Tus datos han sido modificados.", timer: 2000, showConfirmButton: false });
      document.querySelectorAll('input[name="nombre"], input[name="apellido"], input[name="usuario"]')
        .forEach(input => input.setAttribute("disabled", true));
      document.getElementById("btnGuardar").style.display = "none";
      document.getElementById("btnEditar").style.display = "inline-block";
    } else {
      Swal.fire({ icon: "error", title: "Error", text: result.detail || "No se pudo actualizar el usuario." });
    }
  } catch (error) {
    Swal.fire({ icon: "error", title: "Error de red", text: "No se pudo conectar al servidor." });
  }
});

(async function () {
  await verificarSesionYObtenerDatos();
})();
