const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (email === "" || password === "") {
        loginMessage.textContent = "Preencha todos os campos.";
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        loginMessage.textContent = "Informe um email válido.";
        return;
    }

    try {
        const resposta = await fetch("http://localhost:3000/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                senha: password
            })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            loginMessage.textContent = dados.mensagem || "Erro ao fazer login.";
            return;
        }

        // Salva os dados do usuário no navegador
        localStorage.setItem(
            "usuario",
            JSON.stringify(dados.usuario)
        );

        loginMessage.textContent = dados.mensagem;

        // Vai para o dashboard
        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 500);

    } catch (erro) {
        console.error("Erro no login:", erro);

        loginMessage.textContent =
            "Não foi possível conectar ao servidor.";
    }
});