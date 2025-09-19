document
    .getElementById("loginForm")
    .addEventListener("submit", function (event) {
        event.preventDefault();

        const usuario = document.getElementById("usuario").value;
        const password = document.getElementById("password").value;

        if (usuario && password) {
            // Construimos los datos en formato application/x-www-form-urlencoded
            const formData = new URLSearchParams();
            formData.append("username", usuario);
            formData.append("password", password);

            fetch("http://localhost:8000/auth/login", {
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
                    // Guardar los tokens en sessionStorage (o localStorage)
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
        } else {
            Swal.fire({
                icon: "warning",
                title: "Campos incompletos",
                text: "Por favor, completa todos los campos.",
            });
        }
    });
