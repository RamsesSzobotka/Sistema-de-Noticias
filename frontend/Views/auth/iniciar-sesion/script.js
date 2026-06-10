import { API_BASE_URL } from "/config/config.js";
import { guardarSesion } from "/js/auth.js";

document.getElementById("loginForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const usuario = document.getElementById("usuario").value.trim();
    const password = document.getElementById("password").value;

    if (!usuario || !password) {
        Swal.fire({ icon: "warning", title: "Campos incompletos", text: "Por favor, completa todos los campos." });
        return;
    }

    Swal.fire({ title: "Iniciando sesion...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
        const formData = new URLSearchParams();
        formData.append("username", usuario);
        formData.append("password", password);

        const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: formData.toString(),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Error en el login");

        guardarSesion(data.id, data.usuario, data.rol);

        Swal.fire({ icon: "success", title: "Bienvenido!", timer: 2000, showConfirmButton: false })
            .then(() => { window.location.href = "../../index.html"; });
    } catch (error) {
        Swal.fire({ icon: "error", title: "Error", text: error.message, confirmButtonText: "Intentar de nuevo" });
    }
});
