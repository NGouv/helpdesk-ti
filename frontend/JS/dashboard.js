// ==============================
// VERIFICAR USUÁRIO LOGADO
// ==============================

const usuarioSalvo = localStorage.getItem("usuario");

if (!usuarioSalvo) {
    // Se não houver usuário logado,
    // volta para a tela de login
    window.location.href = "index.html";
} else {

    const usuario = JSON.parse(usuarioSalvo);

    console.log("Usuário logado:", usuario);

    // ==============================
    // NOME NO TOPO
    // ==============================

    const nomeUsuario = document.getElementById("nomeUsuario");

    if (nomeUsuario) {
        nomeUsuario.textContent = usuario.nome;
    }


    // ==============================
    // TIPO DO USUÁRIO
    // ==============================

    const tipoUsuario = document.getElementById("tipoUsuario");

    if (tipoUsuario) {
        tipoUsuario.textContent = usuario.tipo;
    }


    // ==============================
    // MENSAGEM DE BOAS-VINDAS
    // ==============================

    const mensagemBoasVindas = document.getElementById("mensagemBoasVindas");

    if (mensagemBoasVindas) {
        mensagemBoasVindas.textContent =
            `Olá, ${usuario.nome}! 👋`;
    }
}


// ==============================
// SAIR DA CONTA
// ==============================

const botaoSair = document.getElementById("botaoSair");

if (botaoSair) {

    botaoSair.addEventListener("click", function (event) {

        event.preventDefault();

        localStorage.removeItem("usuario");

        window.location.href = "index.html";
    });
}

const textosStatus = {
    aberto: "Aberto",
    em_andamento: "Em andamento",
    resolvido: "Resolvido",
    fechado: "Fechado"
};

const classesStatus = {
    aberto: "pending",
    em_andamento: "progress",
    resolvido: "solved",
    fechado: "solved"
};

const carregarDashboard = async () => {
    const chamadosRecentes = document.getElementById("chamadosRecentes");
    const usuarioAtual = JSON.parse(localStorage.getItem("usuario"));

    try {
        const resposta = await fetch(
            `https://abundant-freedom-production-d9e7.up.railway.app/api/dashboard?usuario_id=${usuarioAtual.id}`,
            { cache: "no-store" }
        );
        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.mensagem || "Erro ao carregar dashboard.");
        }

        if (
            !dados ||
            !dados.porStatus ||
            !dados.porPrioridade ||
            !Array.isArray(dados.chamadosRecentes)
        ) {
            throw new Error("Resposta inválida ao carregar dashboard.");
        }

        document.getElementById("totalChamados").textContent = dados.total;
        document.getElementById("chamadosPendentes").textContent = dados.porStatus.aberto;
        document.getElementById("chamadosEmAndamento").textContent = dados.porStatus.em_andamento;
        document.getElementById("chamadosResolvidos").textContent = dados.porStatus.resolvido;

        document.getElementById("prioridadeCritica").textContent = dados.porPrioridade.critica;
        document.getElementById("prioridadeAlta").textContent = dados.porPrioridade.alta;
        document.getElementById("prioridadeMedia").textContent = dados.porPrioridade.media;
        document.getElementById("prioridadeBaixa").textContent = dados.porPrioridade.baixa;

        if (dados.chamadosRecentes.length === 0) {
            chamadosRecentes.innerHTML = "<p>Você ainda não possui chamados.</p>";
            return;
        }

        chamadosRecentes.innerHTML = dados.chamadosRecentes.map((chamado) => {
            const data = new Date(chamado.criado_em).toLocaleDateString("pt-BR");
            const statusTexto = textosStatus[chamado.status] || chamado.status;
            const classeStatus = classesStatus[chamado.status] || "pending";

            return `
                <div class="ticket">
                    <div>
                        <strong>${chamado.titulo}</strong>
                        <p>#${String(chamado.id).padStart(4, "0")} • ${data} • ${chamado.categoria}</p>
                    </div>
                    <span class="status ${classeStatus}">${statusTexto}</span>
                </div>
            `;
        }).join("");
    } catch (erro) {
        console.error("Erro ao carregar dashboard:", erro);
        chamadosRecentes.innerHTML = "<p>Não foi possível carregar os chamados.</p>";
    }
};

carregarDashboard();