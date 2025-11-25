import { API_BASE_URL } from "/config/config.js";

document
    .getElementById("registerForm")
    .addEventListener("submit", function (event) {
        event.preventDefault();

        const nombre = document.getElementById("nombre").value.trim();
        const apellido = document.getElementById("apellido").value.trim();
        const usuario = document.getElementById("usuario").value.trim();
        const password = document.getElementById("password").value;

        const passwordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[-_!@#$%^&*]).{8,}$/;

        if (!passwordRegex.test(password)) {
            Swal.fire({
                icon: "error",
                title: "Contraseña inválida",
                text: "La contraseña debe tener al menos 8 caracteres, una letra mayúscula, una letra minúscula, un número y un carácter especial (-_!@#$%^&*).",
            });
            return;
        }

        // JSON que espera el backend
        const data = {
            nombre: nombre,
            apellido: apellido,
            usuario: usuario,
            contrasena: password, // importante usar 'contrasena' como en el modelo
        };

        fetch(`${API_BASE_URL}/auth/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        })
            .then(async (response) => {
                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result.detail || "Error al registrar usuario");
                }
                return result;
            })
            .then((data) => {
                Swal.fire({
                    icon: "success",
                    title: "¡Registro exitoso!",
                    text: "Usuario registrado correctamente.",
                    timer: 2000,
                    timerProgressBar: true,
                    showConfirmButton: false,
                }).then(() => {
                    window.location.href = "../iniciar-sesion/index.html";
                });
            })
            .catch((error) => {
                console.error("Error:", error);
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: error.message,
                });
            });
    });
