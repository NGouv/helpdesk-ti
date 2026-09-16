const usuarioSalvo = localStorage.getItem("usuario");

if (!usuarioSalvo) {
    window.location.href = "index.html";
}

const usuario = JSON.parse(usuarioSalvo);
const podeExecutarAcoes =
    ["tecnico", "administrador"].includes(usuario.tipo);

const parametros = new URLSearchParams(
    window.location.search
);

const chamadoId = parametros.get("id");

if (!chamadoId) {

    alert("Chamado não encontrado.");

    window.location.href =
        "meus-chamados.html";
}


// Elementos

const ticketNumber =
    document.getElementById("ticketNumber");

const ticketTitle =
    document.getElementById("ticketTitle");

const ticketStatus =
    document.getElementById("ticketStatus");

const ticketCategory =
    document.getElementById("ticketCategory");

const ticketPriority =
    document.getElementById("ticketPriority");

const ticketDate =
    document.getElementById("ticketDate");

const ticketDescription =
    document.getElementById("ticketDescription");

const tecnicoResponsavel =
    document.getElementById("tecnicoResponsavel");

const botaoAssumir =
    document.getElementById("botaoAssumir");

const botaoResolver =
    document.getElementById("botaoResolver");

const botaoFechar =
    document.getElementById("botaoFechar");

const mensagemAcao =
    document.getElementById("mensagemAcao");

const historyContainer =
    document.querySelector(".history");


// Converter status para texto

function traduzirStatus(status) {

    if (status === "aberto") {
        return "Aberto";
    }

    if (status === "em_andamento") {
        return "Em andamento";
    }

    if (status === "resolvido") {
        return "Resolvido";
    }

    if (status === "fechado") {
        return "Fechado";
    }

    return status;
}


// Converter prioridade para texto

function traduzirPrioridade(prioridade) {

    if (prioridade === "critica") {
        return "Crítica";
    }

    if (prioridade === "alta") {
        return "Alta";
    }

    if (prioridade === "media") {
        return "Média";
    }

    if (prioridade === "baixa") {
        return "Baixa";
    }

    return prioridade;
}


// Mostrar histórico

function mostrarHistorico(historico, dataAbertura) {

    if (!historyContainer) {
        return;
    }

    if (!historico || historico.length === 0) {

        historyContainer.innerHTML = `
            <div class="history-item">

                <div class="history-date">
                    ${dataAbertura}
                </div>

                <div class="history-content">

                    <strong>
                        Chamado aberto
                    </strong>

                    <p>
                        Chamado aberto pelo usuário.
                    </p>

                </div>

            </div>
        `;

        return;
    }


    historyContainer.innerHTML =
        historico.map(item => {

            const data =
                new Date(item.criado_em);

            const dataFormatada =
                data.toLocaleDateString("pt-BR");

            let titulo =
                "Atualização do chamado";

            if (
                item.status_novo ===
                "em_andamento"
            ) {
                titulo =
                    "Chamado em atendimento";
            }

            if (
                item.status_novo ===
                "resolvido"
            ) {
                titulo =
                    "Chamado resolvido";
            }

            if (
                item.status_novo ===
                "fechado"
            ) {
                titulo =
                    "Chamado fechado";
            }

            if (
                item.status_novo ===
                "aberto"
            ) {
                titulo =
                    "Chamado reaberto";
            }

            return `
                <div class="history-item">

                    <div class="history-date">
                        ${dataFormatada}
                    </div>

                    <div class="history-content">

                        <strong>
                            ${titulo}
                        </strong>

                        <p>
                            ${item.observacao}
                        </p>

                        <small>
                            Por: ${item.usuario}
                        </small>

                    </div>

                </div>
            `;

        }).join("");
}


// Mostrar botões conforme status

function atualizarBotoes(status) {

    if (botaoAssumir) {
        botaoAssumir.style.display =
            "none";
    }

    if (botaoResolver) {
        botaoResolver.style.display =
            "none";
    }

    if (botaoFechar) {
        botaoFechar.style.display =
            "none";
    }

    if (!podeExecutarAcoes) {
        return;
    }


    if (status === "aberto") {

        if (botaoAssumir) {
            botaoAssumir.style.display =
                "inline-block";
        }

    }


    if (status === "em_andamento") {

        if (botaoResolver) {
            botaoResolver.style.display =
                "inline-block";
        }

    }


    if (status === "resolvido") {

        if (botaoFechar) {
            botaoFechar.style.display =
                "inline-block";
        }

    }
}


// Buscar chamado

async function carregarChamado() {

    try {

        const resposta = await fetch(
            `http://localhost:3000/api/chamados/${chamadoId}?usuario_id=${usuario.id}`
        );

        const chamado =
            await resposta.json();


        if (!resposta.ok) {

            alert(
                chamado.mensagem ||
                "Chamado não encontrado."
            );

            window.location.href =
                "meus-chamados.html";

            return;
        }


        // Número

        ticketNumber.textContent =
            `#${String(chamado.id).padStart(4, "0")}`;


        // Título

        ticketTitle.textContent =
            chamado.titulo;


        // Categoria

        ticketCategory.textContent =
            chamado.categoria;


        // Descrição

        ticketDescription.textContent =
            chamado.descricao;


        // Data

        const data =
            new Date(chamado.criado_em);

        const dataFormatada =
            data.toLocaleDateString("pt-BR");

        ticketDate.textContent =
            dataFormatada;


        // Prioridade

        ticketPriority.textContent =
            traduzirPrioridade(
                chamado.prioridade
            );

        ticketPriority.className =
            `priority ${chamado.prioridade}`;


        // Status

        ticketStatus.textContent =
            traduzirStatus(
                chamado.status
            );

        ticketStatus.className =
            `status ${chamado.status}`;


        // Técnico

        if (chamado.tecnico) {

            tecnicoResponsavel.textContent =
                chamado.tecnico;

        } else {

            tecnicoResponsavel.textContent =
                "A definir";
        }


        // Histórico

        mostrarHistorico(
            chamado.historico,
            dataFormatada
        );


        // Botões

        atualizarBotoes(
            chamado.status
        );

    } catch (erro) {

        console.error(
            "Erro ao carregar chamado:",
            erro
        );

        alert(
            "Não foi possível conectar ao servidor."
        );
    }
}


// Assumir chamado

if (botaoAssumir) {

    botaoAssumir.addEventListener(
        "click",
        async function () {

            await executarAcao(
                "assumir"
            );
        }
    );
}


// Marcar como resolvido

if (botaoResolver) {

    botaoResolver.addEventListener(
        "click",
        async function () {

            await atualizarStatus(
                "resolvido"
            );
        }
    );
}


// Fechar chamado

if (botaoFechar) {

    botaoFechar.addEventListener(
        "click",
        async function () {

            await atualizarStatus(
                "fechado"
            );
        }
    );
}


// Assumir chamado

async function executarAcao(acao) {

    try {

        const resposta = await fetch(
            `http://localhost:3000/api/chamados/${chamadoId}/assumir`,
            {
                method: "PUT",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                        tecnico_id: usuario.id,
                        usuario_id: usuario.id
                })
            }
        );

        const dados =
            await resposta.json();


        if (!resposta.ok) {

            mensagemAcao.textContent =
                dados.mensagem ||
                "Erro ao assumir chamado.";

            return;
        }


        mensagemAcao.textContent =
            dados.mensagem;


        await carregarChamado();

    } catch (erro) {

        console.error(
            "Erro ao assumir chamado:",
            erro
        );

        mensagemAcao.textContent =
            "Não foi possível conectar ao servidor.";
    }
}


// Atualizar status

async function atualizarStatus(novoStatus) {

    try {

        const resposta = await fetch(
            `http://localhost:3000/api/chamados/${chamadoId}/status`,
            {
                method: "PUT",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    status: novoStatus,

                    usuario_id: usuario.id

                })
            }
        );

        const dados =
            await resposta.json();


        if (!resposta.ok) {

            mensagemAcao.textContent =
                dados.mensagem ||
                "Erro ao atualizar status.";

            return;
        }


        mensagemAcao.textContent =
            dados.mensagem;


        await carregarChamado();

    } catch (erro) {

        console.error(
            "Erro ao atualizar status:",
            erro
        );

        mensagemAcao.textContent =
            "Não foi possível conectar ao servidor.";
    }
}


// Botão sair

const botaoSair =
    document.getElementById("botaoSair");

if (botaoSair) {

    botaoSair.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            localStorage.removeItem(
                "usuario"
            );

            window.location.href =
                "index.html";
        }
    );
}


// Carregar chamado

carregarChamado();