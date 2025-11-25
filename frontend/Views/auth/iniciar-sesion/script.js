import { API_BASE_URL } from "/config/config.js";
document
    .getElementById("loginForm")
    .addEventListener("submit", function (event) {
        event.preventDefault();

        const usuario = document.getElementById("usuario").value;
        const password = document.getElementById("password").value;

        if (!usuario || !password) {
            Swal.fire({
                icon: "warning",
                title: "Campos incompletos",
                text: "Por favor, completa todos los campos.",
            });
            return;
        }

        // Mostrar SweetAlert cargando
        Swal.fire({
            title: "Iniciando sesión...",
            html: "Por favor, espera",
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading(); // Muestra el spinner
            },
        });

        const formData = new URLSearchParams();
        formData.append("username", usuario);
        formData.append("password", password);

        fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: formData.toString(),
        })
            .then((response) => {
                if (!response.ok) {
                    return response.json().then((err) => {
                        throw new Error(err.detail || "Error en el login");
                    });
                }
                return response.json();
            })
            .then((data) => {
                sessionStorage.setItem("access_token", data.access_token);
                sessionStorage.setItem("refresh_token", data.refresh_token);

                Swal.fire({
                    icon: "success",
                    title: "¡Bienvenido!",
                    text: "Has iniciado sesión correctamente.",
                    timer: 2000,
                    timerProgressBar: true,
                    showConfirmButton: false,
                }).then(() => {
                    window.location.href = "../../index.html";
                });
            })
            .catch((error) => {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: error.message,
                    confirmButtonText: "Intentar de nuevo",
                });
            });
    });
