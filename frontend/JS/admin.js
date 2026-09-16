const usuarioSalvo = localStorage.getItem("usuario");

const redirecionarParaLogin = () => {
    window.location.href = "index.html";
};

let usuario = null;

if (!usuarioSalvo) {
    redirecionarParaLogin();
} else {
    try {
        usuario = JSON.parse(usuarioSalvo);
    } catch (erro) {
        localStorage.removeItem("usuario");
        redirecionarParaLogin();
    }

    if (!usuario || usuario.tipo !== "administrador") {
        window.location.href = "dashboard.html";
    }
}

const apiBase = "https://abundant-freedom-production-d9e7.up.railway.app/api/admin";

const textosStatus = {
    aberto: "Aberto",
    em_andamento: "Em andamento",
    resolvido: "Resolvido",
    fechado: "Fechado"
};

const textosPrioridade = {
    baixa: "Baixa",
    media: "M&eacute;dia",
    alta: "Alta",
    critica: "Cr&iacute;tica"
};

const classesStatus = {
    aberto: "admin-status-aberto",
    em_andamento: "admin-status-em-andamento",
    resolvido: "admin-status-resolvido",
    fechado: "admin-status-fechado"
};

const escaparHtml = (valor) => String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const formatarData = (valor) => {
    if (!valor) {
        return "-";
    }

    return new Date(valor).toLocaleDateString("pt-BR");
};

const buscarDados = async (recurso) => {
    const resposta = await fetch(
        `${apiBase}/${recurso}?usuario_id=${encodeURIComponent(usuario.id)}`
    );
    const dados = await resposta.json();

    if (!resposta.ok) {
        if (resposta.status === 401 || resposta.status === 403) {
            window.location.href = "dashboard.html";
        }

        throw new Error(dados.mensagem || "Erro ao carregar dados administrativos.");
    }

    return dados;
};

const mostrarErro = (elemento, mensagem) => {
    elemento.innerHTML = `<tr><td colspan="8" class="admin-error">${mensagem}</td></tr>`;
};

const carregarResumo = async () => {
    const dados = await buscarDados("dashboard");

    document.getElementById("totalChamados").textContent = dados.total;
    document.getElementById("chamadosAbertos").textContent = dados.porStatus.aberto;
    document.getElementById("chamadosEmAndamento").textContent = dados.porStatus.em_andamento;
    document.getElementById("chamadosResolvidos").textContent = dados.porStatus.resolvido;
    document.getElementById("chamadosFechados").textContent = dados.porStatus.fechado;
};

const carregarUsuarios = async () => {
    const tabela = document.getElementById("usuariosTabela");
    const usuarios = await buscarDados("usuarios");

    if (usuarios.length === 0) {
        tabela.innerHTML = "<tr><td colspan=\"3\" class=\"admin-empty\">Nenhum usuario cadastrado.</td></tr>";
        return;
    }

    tabela.innerHTML = usuarios.map((item) => `
        <tr>
            <td><strong>${escaparHtml(item.nome)}</strong></td>
            <td>${escaparHtml(item.email)}</td>
            <td>${escaparHtml(item.tipo)}</td>
        </tr>
    `).join("");
};

const carregarChamados = async () => {
    const tabela = document.getElementById("chamadosTabela");
    const chamados = await buscarDados("chamados");

    if (chamados.length === 0) {
        tabela.innerHTML = "<tr><td colspan=\"8\" class=\"admin-empty\">Nenhum chamado cadastrado.</td></tr>";
        return;
    }

    tabela.innerHTML = chamados.map((chamado) => {
        const status = textosStatus[chamado.status] || chamado.status;
        const prioridade = textosPrioridade[chamado.prioridade] || chamado.prioridade;
        const classeStatus = classesStatus[chamado.status] || "admin-status-aberto";

        return `
            <tr>
                <td>#${escaparHtml(String(chamado.id).padStart(4, "0"))}</td>
                <td><strong>${escaparHtml(chamado.titulo)}</strong></td>
                <td>${escaparHtml(chamado.usuario)}</td>
                <td>${escaparHtml(chamado.tecnico || "Nao atribuido")}</td>
                <td>${escaparHtml(chamado.categoria)}</td>
                <td><span class="priority admin-priority-${escaparHtml(chamado.prioridade)}">${prioridade}</span></td>
                <td><span class="status ${classeStatus}">${status}</span></td>
                <td>${formatarData(chamado.criado_em)}</td>
            </tr>
        `;
    }).join("");
};

const carregarTecnicos = async () => {
    const tabela = document.getElementById("tecnicosTabela");
    const tecnicos = await buscarDados("tecnicos");

    if (tecnicos.length === 0) {
        tabela.innerHTML = "<tr><td colspan=\"3\" class=\"admin-empty\">Nenhum tecnico cadastrado.</td></tr>";
        return;
    }

    tabela.innerHTML = tecnicos.map((tecnico) => `
        <tr>
            <td><strong>${escaparHtml(tecnico.nome)}</strong></td>
            <td>${escaparHtml(tecnico.email)}</td>
            <td>${Number(tecnico.chamados_atribuidos)}</td>
        </tr>
    `).join("");
};

const carregarAreaAdministrativa = async () => {
    document.getElementById("nomeAdministrador").textContent = usuario.nome;
    document.getElementById("tipoAdministrador").textContent = usuario.tipo;

    const carregamentos = [
        [carregarResumo, document.getElementById("totalChamados").closest(".cards")],
        [carregarUsuarios, document.getElementById("usuariosTabela")],
        [carregarChamados, document.getElementById("chamadosTabela")],
        [carregarTecnicos, document.getElementById("tecnicosTabela")]
    ];

    await Promise.all(carregamentos.map(async ([carregamento, elemento]) => {
        try {
            await carregamento();
        } catch (erro) {
            console.error("Erro ao carregar area administrativa:", erro);

            if (elemento.tagName === "TBODY") {
                mostrarErro(elemento, "Nao foi possivel carregar os dados.");
            }
        }
    }));
};

const botaoSair = document.getElementById("botaoSair");

if (botaoSair) {
    botaoSair.addEventListener("click", (event) => {
        event.preventDefault();
        localStorage.removeItem("usuario");
        window.location.href = "index.html";
    });
}

if (usuario && usuario.tipo === "administrador") {
    carregarAreaAdministrativa();
}
