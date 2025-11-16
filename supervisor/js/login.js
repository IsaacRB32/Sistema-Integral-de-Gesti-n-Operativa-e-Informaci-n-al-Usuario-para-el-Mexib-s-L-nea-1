const btnLogin = document.getElementById("btnLogin");
const msg = document.getElementById("msg");

btnLogin.addEventListener("click", async () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    msg.textContent = "";

    if (!email || !password) {
        msg.textContent = "Completa todos los campos.";
        return;
    }

    try {
        const resp = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await resp.json();

        if (!resp.ok) {
            msg.textContent = data.message || "Credenciales incorrectas";
            return;
        }

        msg.style.color = "#41f76c";
        msg.textContent = "Login exitoso";

        setTimeout(() => {
            window.location.href = "/supervisor/dashboard.html";
        }, 800);

    } catch (error) {
        msg.textContent = "Error de conexión con el servidor";
    }
});
