const registerForm = document.getElementById("registerForm");
const registerMessage = document.getElementById("registerMessage");

registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const nome = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("password").value;
    const confirmarSenha = document.getElementById("confirmPassword").value;

    if (!nome || !email || !senha || !confirmarSenha) {
        registerMessage.textContent = "Preencha todos os campos.";
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        registerMessage.textContent = "Informe um email válido.";
        return;
    }

    if (senha !== confirmarSenha) {
        registerMessage.textContent = "As senhas não coincidem.";
        return;
    }

    try {
        const resposta = await fetch("http://localhost:3000/api/usuarios", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ nome, email, senha })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            registerMessage.textContent = dados.mensagem || "Erro ao criar conta.";
            return;
        }

        registerMessage.textContent = "Conta criada com sucesso! Redirecionando para o login...";

        setTimeout(() => {
            window.location.href = "index.html";
        }, 1200);
    } catch (erro) {
        console.error("Erro ao criar conta:", erro);
        registerMessage.textContent = "Não foi possível conectar ao servidor.";
    }
});
