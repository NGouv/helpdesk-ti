// ==============================
// VERIFICAR USUÁRIO LOGADO
// ==============================

const usuarioSalvo = localStorage.getItem("usuario");

if (!usuarioSalvo) {
    window.location.href = "index.html";
}

const usuario = JSON.parse(usuarioSalvo);


// ==============================
// ELEMENTOS DO FORMULÁRIO
// ==============================

const ticketForm = document.getElementById("ticketForm");
const ticketMessage = document.getElementById("ticketMessage");
const priorityAutomationMessage = document.getElementById("priorityAutomationMessage");

const textosPrioridade = {
    baixa: "Baixa",
    media: "Média",
    alta: "Alta",
    critica: "Crítica"
};


// ==============================
// ABRIR CHAMADO
// ==============================

ticketForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const titulo = document.getElementById("title").value.trim();
    const categoriaId = document.getElementById("category").value;
    const prioridade = document.getElementById("priority").value;
    const descricao = document.getElementById("description").value.trim();


    // Verificar campos
    if (!titulo || !categoriaId || !descricao) {

        ticketMessage.textContent =
            "Preencha todos os campos.";

        return;
    }


    try {

        const resposta = await fetch(
            "https://abundant-freedom-production-d9e7.up.railway.app/api/chamados",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    usuario_id: usuario.id,

                    categoria_id: Number(categoriaId),

                    titulo: titulo,

                    descricao: descricao,

                    prioridade: prioridade || null

                })
            }
        );


        const dados = await resposta.json();


        // Erro da API
        if (!resposta.ok) {

            ticketMessage.textContent =
                dados.mensagem || "Erro ao abrir chamado.";

            return;
        }


        // Sucesso
        ticketMessage.textContent =
            dados.mensagem;

        if (priorityAutomationMessage && dados.prioridade) {
            priorityAutomationMessage.textContent =
                `Prioridade: ${textosPrioridade[dados.prioridade] || dados.prioridade}. Definida automaticamente pelo sistema.`;
        }


        // Limpar formulário
        ticketForm.reset();


        // Voltar para o dashboard
        setTimeout(() => {

            window.location.href = "dashboard.html";

        }, 1000);


    } catch (erro) {

        console.error(
            "Erro ao abrir chamado:",
            erro
        );

        ticketMessage.textContent =
            "Não foi possível conectar ao servidor.";
    }

});


// ==============================
// BOTÃO SAIR
// ==============================

const botaoSair = document.getElementById("botaoSair");

if (botaoSair) {

    botaoSair.addEventListener("click", function (event) {

        event.preventDefault();

        localStorage.removeItem("usuario");

        window.location.href = "index.html";

    });

}