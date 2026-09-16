const recoveryForm = document.getElementById("recoveryForm");
const recoveryMessage = document.getElementById("recoveryMessage");

recoveryForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();

    if (!email) {
        recoveryMessage.textContent = "Informe seu e-mail.";
        return;
    }

    try {
        const resposta = await fetch("http://localhost:3000/api/recuperar-senha", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email })
        });

        const dados = await resposta.json();
        recoveryMessage.textContent = dados.mensagem || "Solicitação recebida.";
    } catch (erro) {
        console.error("Erro ao solicitar recuperação:", erro);
        recoveryMessage.textContent = "Não foi possível conectar ao servidor.";
    }
});
