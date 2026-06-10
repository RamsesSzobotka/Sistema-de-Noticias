import { API_BASE_URL } from "/config/config.js";
import { guardarSesion } from "/js/auth.js";

document.getElementById("registerForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const apellido = document.getElementById("apellido").value.trim();
    const usuario = document.getElementById("usuario").value.trim();
    const password = document.getElementById("password").value;

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[-_!@#$%^&*]).{8,}$/;

    if (!passwordRegex.test(password)) {
        Swal.fire({ icon: "error", title: "Contrasena invalida", text: "La contrasena debe tener al menos 8 caracteres, una letra mayuscula, una minuscula, un numero y un caracter especial (-_!@#$%^&*)." });
        return;
    }

    Swal.fire({ title: "Registrando...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre, apellido, usuario, contrasena: password }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Error al registrar");

        guardarSesion(data.id, data.usuario, data.rol);

        Swal.fire({ icon: "success", title: "Registro exitoso! Bienvenido", timer: 2000, showConfirmButton: false })
            .then(() => { window.location.href = "../../index.html"; });
    } catch (error) {
        Swal.fire({ icon: "error", title: "Error", text: error.message });
    }
});
