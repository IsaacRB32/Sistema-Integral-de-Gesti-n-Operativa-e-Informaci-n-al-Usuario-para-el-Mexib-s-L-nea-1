// supervisor/js/login.js
const btnLogin = document.getElementById("btnLogin");
const msg = document.getElementById("msg");

btnLogin.addEventListener("click", async () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    msg.textContent = "";
            msg.className = "mt-5 text-center text-sm font-medium min-h-[20px]";

    if (!email || !password) {
        msg.textContent = "⚠️ Completa todos los campos.";
                msg.classList.add("text-red-600");
        return;
    }

    // Deshabilitar botón mientras carga
    btnLogin.disabled = true;
    btnLogin.textContent = "Ingresando...";
            btnLogin.classList.add("loading", "opacity-75", "cursor-not-allowed");

    try {
        const resp = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await resp.json();

        if (!resp.ok) {
            msg.textContent = "❌ " + (data.message || "Credenciales incorrectas");
                    msg.classList.add("text-red-600");
            btnLogin.disabled = false;
            btnLogin.textContent = "Ingresar";
                    btnLogin.classList.remove("loading", "opacity-75", "cursor-not-allowed");
            return;
        }

                // Guardar datos de sesión
        localStorage.setItem("supervisor_nombre", data.usuario.nombre);
        localStorage.setItem("supervisor_email", data.usuario.email);

        msg.textContent = "✓ Login exitoso, redirigiendo...";
                msg.classList.add("text-green-600");

        setTimeout(() => {
            window.location.href = "/supervisor/dashboard.html";
        }, 800);

    } catch (error) {
        console.error("Error de conexión:", error);
        msg.textContent = "❌ Error de conexión con el servidor";
                msg.classList.add("text-red-600");
        btnLogin.disabled = false;
        btnLogin.textContent = "Ingresar";
                btnLogin.classList.remove("loading", "opacity-75", "cursor-not-allowed");
    }
});

// Permitir login con Enter
document.getElementById("password").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        btnLogin.click();
    }
});

document.getElementById("email").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        document.getElementById("password").focus();
    }
});