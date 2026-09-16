// Verificar usuário logado

const usuarioSalvo = localStorage.getItem("usuario");

if (!usuarioSalvo) {
    window.location.href = "index.html";
}

const usuario = JSON.parse(usuarioSalvo);


// Elementos da página

const ticketsList = document.getElementById("ticketsList");
const searchTicket = document.getElementById("searchTicket");
const statusFilter = document.getElementById("statusFilter");

let chamados = [];


// Buscar chamados do usuário

async function carregarChamados() {

    try {

        const resposta = await fetch(
            `https://abundant-freedom-production-d9e7.up.railway.app/api/chamados/usuario/${usuario.id}?usuario_id=${usuario.id}`,
            { cache: "no-store" }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.mensagem || "Erro ao carregar chamados.");
        }

        if (!Array.isArray(dados)) {
            throw new Error("Resposta inválida ao carregar chamados.");
        }

        chamados = dados;

        if (chamados.length === 0) {
            ticketsList.innerHTML =
                "<p>Você ainda não possui chamados.</p>";
            return;
        }

        mostrarChamados();

    } catch (erro) {

        console.error("Erro ao buscar chamados:", erro);

        ticketsList.innerHTML =
            "<p>Não foi possível carregar os chamados.</p>";
    }
}


// Mostrar chamados

function mostrarChamados() {

    const pesquisa = searchTicket.value
        .toLowerCase()
        .trim();

    const filtroStatus = statusFilter.value;

    const chamadosFiltrados = chamados.filter(chamado => {

        const correspondePesquisa =
            chamado.titulo.toLowerCase().includes(pesquisa);

        const correspondeStatus =
            filtroStatus === "todos" ||
            chamado.status === filtroStatus;

        return correspondePesquisa && correspondeStatus;
    });


    if (chamadosFiltrados.length === 0) {

        ticketsList.innerHTML =
            "<p>Nenhum chamado encontrado.</p>";

        return;
    }


    ticketsList.innerHTML = chamadosFiltrados.map(chamado => {

        const prioridade = chamado.prioridade;

        const status = chamado.status;


        let prioridadeTexto = prioridade;

        if (prioridade === "critica") {
            prioridadeTexto = "Crítica";
        } else if (prioridade === "alta") {
            prioridadeTexto = "Alta";
        } else if (prioridade === "media") {
            prioridadeTexto = "Média";
        } else if (prioridade === "baixa") {
            prioridadeTexto = "Baixa";
        }


        let statusTexto = status;

        if (status === "aberto") {
            statusTexto = "Aberto";
        } else if (status === "em_andamento") {
            statusTexto = "Em andamento";
        } else if (status === "resolvido") {
            statusTexto = "Resolvido";
        } else if (status === "fechado") {
            statusTexto = "Fechado";
        }


        let data = new Date(chamado.criado_em);

        let dataFormatada = data.toLocaleDateString("pt-BR");


        let prioridadeClasse = prioridade;

        let statusClasse = status;

        return `
            <div class="ticket-row">

                <span>#${String(chamado.id).padStart(4, "0")}</span>

                <div>
                    <strong>${chamado.titulo}</strong>
                    <small>${dataFormatada}</small>
                </div>

                <span>${chamado.categoria}</span>

                <span class="priority ${prioridadeClasse}">
                    ${prioridadeTexto}
                </span>

                <span class="status ${statusClasse}">
                    ${statusTexto}
                </span>

                <a href="detalhes-chamado.html?id=${chamado.id}">
                    Ver detalhes
                </a>

            </div>
        `;

    }).join("");
}


// Pesquisar

searchTicket.addEventListener("input", mostrarChamados);


// Filtrar por status

statusFilter.addEventListener("change", mostrarChamados);


// Botão sair

const botaoSair = document.getElementById("botaoSair");

if (botaoSair) {

    botaoSair.addEventListener("click", function (event) {

        event.preventDefault();

        localStorage.removeItem("usuario");

        window.location.href = "index.html";

    });

}


// Carregar chamados ao abrir a página

carregarChamados();