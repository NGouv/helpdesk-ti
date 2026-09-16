const usuarioSalvo = localStorage.getItem("usuario");

if (!usuarioSalvo) {
    window.location.href = "index.html";
}

const usuario = JSON.parse(usuarioSalvo);

if (!["tecnico", "administrador"].includes(usuario.tipo)) {
    window.location.href = "dashboard.html";
}

const nomeUsuario = document.getElementById("nomeUsuario");
const tipoUsuario = document.getElementById("tipoUsuario");
const ticketsList = document.getElementById("ticketsList");

if (nomeUsuario) {
    nomeUsuario.textContent = usuario.nome;
}

if (tipoUsuario) {
    tipoUsuario.textContent = usuario.tipo;
}

async function carregarChamados() {

    try {

        const resposta = await fetch(
            `http://localhost:3000/api/chamados?usuario_id=${usuario.id}`
        );

        const chamados = await resposta.json();

        if (!resposta.ok) {
            ticketsList.innerHTML =
                "<p>Erro ao carregar chamados.</p>";
            return;
        }

        if (chamados.length === 0) {
            ticketsList.innerHTML =
                "<p>Nenhum chamado cadastrado.</p>";
            return;
        }

        ticketsList.innerHTML = chamados.map(chamado => {

            let prioridadeTexto = chamado.prioridade;

            if (chamado.prioridade === "critica") {
                prioridadeTexto = "Crítica";
            } else if (chamado.prioridade === "alta") {
                prioridadeTexto = "Alta";
            } else if (chamado.prioridade === "media") {
                prioridadeTexto = "Média";
            } else if (chamado.prioridade === "baixa") {
                prioridadeTexto = "Baixa";
            }

            let statusTexto = chamado.status;

            if (chamado.status === "aberto") {
                statusTexto = "Aberto";
            } else if (chamado.status === "em_andamento") {
                statusTexto = "Em andamento";
            } else if (chamado.status === "resolvido") {
                statusTexto = "Resolvido";
            } else if (chamado.status === "fechado") {
                statusTexto = "Fechado";
            }

            const data = new Date(chamado.criado_em);

            const dataFormatada =
                data.toLocaleDateString("pt-BR");

            return `
                <div class="ticket-row">

                    <span>
                        #${String(chamado.id).padStart(4, "0")}
                    </span>

                    <div>
                        <strong>${chamado.titulo}</strong>
                        <small>${dataFormatada}</small>
                    </div>

                    <span>
                        ${chamado.usuario}
                    </span>

                    <span>
                        ${chamado.categoria}
                    </span>

                    <span class="priority ${chamado.prioridade}">
                        ${prioridadeTexto}
                    </span>

                    <span class="status ${chamado.status}">
                        ${statusTexto}
                    </span>

                    <a href="detalhes-chamado.html?id=${chamado.id}">
                        Ver detalhes
                    </a>

                </div>
            `;

        }).join("");

    } catch (erro) {

        console.error(
            "Erro ao buscar chamados:",
            erro
        );

        ticketsList.innerHTML =
            "<p>Não foi possível conectar ao servidor.</p>";
    }
}

const botaoSair =
    document.getElementById("botaoSair");

if (botaoSair) {

    botaoSair.addEventListener("click", function (event) {

        event.preventDefault();

        localStorage.removeItem("usuario");

        window.location.href = "index.html";

    });
}

carregarChamados();