const db = require("../config/database");

const idValido = (valor) => Number.isInteger(Number(valor)) && Number(valor) > 0;

const buscarUsuario = (usuarioId, callback) => {
    const sql = `
        SELECT id, tipo
        FROM usuarios
        WHERE id = ?
    `;

    db.query(sql, [usuarioId], (err, resultados) => {
        if (err) {
            return callback(err);
        }

        if (resultados.length === 0) {
            return callback(null, null);
        }

        callback(null, resultados[0]);
    });
};

const exigirPermissao = (usuarioId, tiposPermitidos, callback) => {
    buscarUsuario(usuarioId, (err, usuario) => {
        if (err) {
            return callback(err);
        }

        if (!usuario) {
            return callback(null, false, null);
        }

        callback(null, tiposPermitidos.includes(usuario.tipo), usuario);
    });
};

const normalizarTexto = (texto) => texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const definirPrioridadeAutomatica = (titulo, descricao, categoria) => {
    const tituloNormalizado = normalizarTexto(titulo);
    const texto = normalizarTexto(`${titulo} ${descricao} ${categoria}`);
    const categoriaNormalizada = normalizarTexto(categoria);

    const termosCriticos = [
        "sistema parado",
        "servidor fora do ar",
        "servico indisponivel",
        "todos os usuarios sem acesso",
        "todos usuarios sem acesso",
        "empresa inteira sem acesso",
        "perda de dados",
        "dados perdidos"
    ];

    if (termosCriticos.some((termo) => texto.includes(termo))) {
        return "critica";
    }

    const computadorComFalha =
        categoriaNormalizada.includes("hardware") &&
        /((computador|notebook|maquina).*(nao funciona|nao liga|parou)|(nao funciona|nao liga|parou).*(computador|notebook|maquina))/.test(texto);

    const termosAltos = [
        "sistema nao abre",
        "sistema nao funciona",
        "internet da empresa indisponivel",
        "erro grave",
        "impede o trabalho",
        "nao consigo trabalhar",
        "computador nao funciona",
        "computador nao liga"
    ];

    if (
        computadorComFalha ||
        termosAltos.some((termo) => texto.includes(termo)) ||
        (categoriaNormalizada.includes("software") && tituloNormalizado.includes("nao abre"))
    ) {
        return "alta";
    }

    const termosBaixos = [
        "duvida",
        "duvida sobre",
        "solicitacao simples",
        "ajuste",
        "configuracao",
        "orientacao",
        "informacao"
    ];

    if (termosBaixos.some((termo) => texto.includes(termo))) {
        return "baixa";
    }

    return "media";
};

const textoPrioridade = (prioridade) => ({
    baixa: "baixa",
    media: "media",
    alta: "alta",
    critica: "critica"
}[prioridade] || prioridade);

// Cadastrar chamado
const cadastrarChamado = (req, res) => {

    const {
        usuario_id,
        categoria_id,
        titulo,
        descricao,
        prioridade
    } = req.body;

    if (
        !idValido(usuario_id) ||
        !idValido(categoria_id) ||
        !titulo ||
        !descricao
    ) {
        return res.status(400).json({
            mensagem: "Usuário, categoria, título e descrição são obrigatórios."
        });
    }

    buscarUsuario(usuario_id, (err, usuario) => {
        if (err) {
            console.error("Erro ao validar usuário:", err);
            return res.status(500).json({
                mensagem: "Erro ao validar usuário."
            });
        }

        if (!usuario) {
            return res.status(403).json({
                mensagem: "Usuário inválido."
            });
        }

        const categoriaSql = `
            SELECT nome
            FROM categorias
            WHERE id = ?
        `;

        db.query(categoriaSql, [categoria_id], (err, categorias) => {
            if (err) {
                console.error("Erro ao buscar categoria:", err);
                return res.status(500).json({
                    mensagem: "Erro ao buscar categoria."
                });
            }

            if (categorias.length === 0) {
                return res.status(400).json({
                    mensagem: "Categoria inválida."
                });
            }

            const prioridadeAutomatica = definirPrioridadeAutomatica(
                titulo,
                descricao,
                categorias[0].nome
            );

            const sql = `
                INSERT INTO chamados
                (usuario_id, categoria_id, titulo, descricao, prioridade)
                VALUES (?, ?, ?, ?, ?)
            `;

            db.query(
                sql,
                [
                    usuario_id,
                    categoria_id,
                    titulo,
                    descricao,
                    prioridadeAutomatica
                ],
                (err, resultado) => {

                    if (err) {
                        console.error(
                            "Erro ao cadastrar chamado:",
                            err
                        );

                        return res.status(500).json({
                            mensagem: "Erro ao cadastrar chamado."
                        });
                    }

                    const historicoSql = `
                        INSERT INTO historico_chamados
                        (
                            chamado_id,
                            usuario_id,
                            status_anterior,
                            status_novo,
                            observacao
                        )
                        VALUES (?, ?, NULL, NULL, ?)
                    `;

                    const observacao =
                        `Prioridade definida automaticamente como ${textoPrioridade(prioridadeAutomatica)}.`;

                    db.query(
                        historicoSql,
                        [resultado.insertId, usuario_id, observacao],
                        (err) => {
                            if (err) {
                                console.error(
                                    "Erro ao registrar prioridade automática:",
                                    err
                                );

                                return res.status(500).json({
                                    mensagem:
                                        "Chamado aberto, mas não foi possível registrar a automação."
                                });
                            }

                            return res.status(201).json({
                                mensagem: "Chamado aberto com sucesso!",
                                id: resultado.insertId,
                                prioridade: prioridadeAutomatica,
                                prioridadeAutomatica: true
                            });
                        }
                    );
                });
        });
    });
};


// Buscar chamados do usuário
const listarChamadosUsuario = (req, res) => {

    const usuarioId = req.params.usuarioId;
    const solicitanteId = req.query.usuario_id;

    if (!idValido(usuarioId) || !idValido(solicitanteId)) {
        return res.status(400).json({
            mensagem: "Usuário solicitante é obrigatório."
        });
    }

    if (String(solicitanteId) !== String(usuarioId)) {
        return res.status(403).json({
            mensagem: "Você só pode visualizar seus próprios chamados."
        });
    }

    buscarUsuario(solicitanteId, (err, usuario) => {
        if (err) {
            return res.status(500).json({
                mensagem: "Erro ao validar usuário."
            });
        }

        if (!usuario) {
            return res.status(403).json({
                mensagem: "Usuário inválido."
            });
        }

    const sql = `
        SELECT
            chamados.id,
            chamados.titulo,
            chamados.descricao,
            chamados.prioridade,
            chamados.status,
            chamados.criado_em,
            categorias.nome AS categoria
        FROM chamados
        INNER JOIN categorias
            ON chamados.categoria_id = categorias.id
        WHERE chamados.usuario_id = ?
        ORDER BY chamados.criado_em DESC
    `;

        db.query(
            sql,
            [usuarioId],
            (err, resultados) => {

                if (err) {
                console.error(
                    "Erro ao buscar chamados:",
                    err
                );

                    return res.status(500).json({
                        mensagem: "Erro ao buscar chamados."
                    });
                }

                return res.status(200).json(resultados);
            }
        );
    });
};


// Buscar chamado por ID
const buscarChamadoPorId = (req, res) => {

    const chamadoId = req.params.id;
    const solicitanteId = req.query.usuario_id;

    if (!idValido(chamadoId) || !idValido(solicitanteId)) {
        return res.status(400).json({
            mensagem: "Usuário solicitante é obrigatório."
        });
    }

    const sqlChamado = `
        SELECT
            chamados.id,
            chamados.usuario_id,
            chamados.titulo,
            chamados.descricao,
            chamados.prioridade,
            chamados.status,
            chamados.criado_em,
            categorias.nome AS categoria,
            tecnico.nome AS tecnico
        FROM chamados
        INNER JOIN categorias
            ON chamados.categoria_id = categorias.id
        LEFT JOIN usuarios AS tecnico
            ON chamados.tecnico_id = tecnico.id
        WHERE chamados.id = ?
    `;

    db.query(
        sqlChamado,
        [chamadoId],
        (err, resultados) => {

            if (err) {
                console.error(
                    "Erro ao buscar chamado:",
                    err
                );

                return res.status(500).json({
                    mensagem: "Erro ao buscar chamado."
                });
            }

            if (resultados.length === 0) {
                return res.status(404).json({
                    mensagem: "Chamado não encontrado."
                });
            }

            const chamado = resultados[0];

            exigirPermissao(
                solicitanteId,
                ["usuario", "tecnico", "administrador"],
                (erroUsuario, usuarioAutorizado, usuario) => {
                    if (erroUsuario) {
                        return res.status(500).json({
                            mensagem: "Erro ao validar usuário."
                        });
                    }

                    if (!usuarioAutorizado) {
                        return res.status(403).json({
                            mensagem: "Usuário inválido."
                        });
                    }

                    if (
                        usuario.tipo === "usuario" &&
                        String(chamado.usuario_id) !== String(solicitanteId)
                    ) {
                        return res.status(403).json({
                            mensagem: "Você não tem acesso a este chamado."
                        });
                    }

            const sqlHistorico = `
                SELECT
                    historico_chamados.id,
                    historico_chamados.status_anterior,
                    historico_chamados.status_novo,
                    historico_chamados.observacao,
                    historico_chamados.criado_em,
                    usuarios.nome AS usuario
                FROM historico_chamados
                INNER JOIN usuarios
                    ON historico_chamados.usuario_id = usuarios.id
                WHERE historico_chamados.chamado_id = ?
                ORDER BY historico_chamados.criado_em ASC
            `;

                    db.query(
                        sqlHistorico,
                        [chamadoId],
                        (err, historico) => {

                            if (err) {
                        console.error(
                            "Erro ao buscar histórico:",
                            err
                        );

                                return res.status(500).json({
                                    mensagem:
                                        "Erro ao buscar histórico."
                                });
                            }

                            chamado.historico = historico;

                            return res.status(200).json(chamado);
                        }
                    );
                }
            );
        }
    );
};


// Listar todos os chamados
const listarTodosChamados = (req, res) => {

    const solicitanteId = req.query.usuario_id;

    if (!solicitanteId) {
        return res.status(400).json({
            mensagem: "Usuário solicitante é obrigatório."
        });
    }

    exigirPermissao(
        solicitanteId,
        ["tecnico", "administrador"],
        (errUsuario, autorizado) => {
            if (errUsuario) {
                return res.status(500).json({
                    mensagem: "Erro ao validar usuário."
                });
            }

            if (!autorizado) {
                return res.status(403).json({
                    mensagem: "Apenas técnicos e administradores podem acessar todos os chamados."
                });
            }

    const sql = `
        SELECT
            chamados.id,
            chamados.titulo,
            chamados.descricao,
            chamados.prioridade,
            chamados.status,
            chamados.criado_em,
            categorias.nome AS categoria,
            usuarios.nome AS usuario
        FROM chamados
        INNER JOIN categorias
            ON chamados.categoria_id = categorias.id
        INNER JOIN usuarios
            ON chamados.usuario_id = usuarios.id
        ORDER BY chamados.criado_em DESC
    `;

        db.query(
            sql,
            (err, resultados) => {

                if (err) {
                console.error(
                    "Erro ao buscar chamados:",
                    err
                );

                    return res.status(500).json({
                        mensagem: "Erro ao buscar chamados."
                    });
                }

                return res.status(200).json(resultados);
            }
        );
    });
};


// Técnico assume o chamado
const assumirChamado = (req, res) => {

    const chamadoId = req.params.id;
    const tecnicoId = req.body.tecnico_id;
    const solicitanteId = req.body.usuario_id;

    if (
        !idValido(chamadoId) ||
        !idValido(tecnicoId) ||
        !idValido(solicitanteId)
    ) {
        return res.status(400).json({
            mensagem: "Chamado e usuário solicitante são obrigatórios."
        });
    }

    exigirPermissao(
        solicitanteId,
        ["tecnico", "administrador"],
        (erroUsuario, autorizado) => {
            if (erroUsuario) {
                return res.status(500).json({
                    mensagem: "Erro ao validar usuário."
                });
            }

            if (!autorizado) {
                return res.status(403).json({
                    mensagem: "Apenas técnicos e administradores podem assumir chamados."
                });
            }

            exigirPermissao(
                tecnicoId,
                ["tecnico", "administrador"],
                (erroTecnico, tecnicoAutorizado) => {
                    if (erroTecnico) {
                        return res.status(500).json({
                            mensagem: "Erro ao validar técnico."
                        });
                    }

                    if (!tecnicoAutorizado) {
                        return res.status(403).json({
                            mensagem: "O usuário informado não é um técnico autorizado."
                        });
                    }

            // Primeiro verificar o chamado
            const buscarSql = `
                SELECT status
                FROM chamados
                WHERE id = ?
            `;

                    db.query(
                buscarSql,
                [chamadoId],
                (err, resultados) => {

                    if (err) {
                console.error(
                    "Erro ao buscar chamado:",
                    err
                );

                        return res.status(500).json({
                            mensagem: "Erro ao buscar chamado."
                        });
                    }

                    if (resultados.length === 0) {
                        return res.status(404).json({
                            mensagem: "Chamado não encontrado."
                        });
                    }

                    const statusAnterior =
                        resultados[0].status;

                    if (statusAnterior !== "aberto") {
                        return res.status(400).json({
                            mensagem: "Somente chamados abertos podem ser assumidos."
                        });
                    }


                    // Atualizar chamado
                    const sql = `
                        UPDATE chamados
                        SET tecnico_id = ?, status = 'em_andamento'
                        WHERE id = ?
                    `;

                    db.query(
                        sql,
                        [tecnicoId, chamadoId],
                        (err, resultado) => {

                            if (err) {
                        console.error(
                            "Erro ao assumir chamado:",
                            err
                        );

                                return res.status(500).json({
                                    mensagem:
                                        "Erro ao assumir chamado."
                                });
                            }

                            if (resultado.affectedRows === 0) {
                        return res.status(404).json({
                            mensagem:
                                "Chamado não encontrado."
                        });
                            }


                            // Registrar no histórico
                            const historicoSql = `
                        INSERT INTO historico_chamados
                        (
                            chamado_id,
                            usuario_id,
                            status_anterior,
                            status_novo,
                            observacao
                        )
                        VALUES (?, ?, ?, ?, ?)
                    `;

                            const observacao =
                                "Chamado assumido pelo técnico.";

                            db.query(
                                historicoSql,
                                [
                                    chamadoId,
                                    tecnicoId,
                                    statusAnterior,
                                    "em_andamento",
                                    observacao
                                ],
                                (err) => {

                                    if (err) {
                                console.error(
                                    "Erro ao registrar histórico:",
                                    err
                                );

                                        return res.status(500).json({
                                            mensagem:
                                                "Chamado assumido, mas não foi possível registrar o histórico."
                                        });
                                    }

                                    return res.status(200).json({
                                        mensagem:
                                            "Chamado assumido com sucesso!"
                                    });
                                }
                            );
                        }
                    );
                }
                    );
                }
            );
        }
    );
};


// Atualizar status do chamado
const atualizarStatusChamado = (req, res) => {

    const chamadoId = req.params.id;
    const novoStatus = req.body.status;
    const usuarioId = req.body.usuario_id;

    const statusValidos = [
        "aberto",
        "em_andamento",
        "resolvido",
        "fechado"
    ];

    if (!idValido(chamadoId) ||
        !novoStatus ||
        !statusValidos.includes(novoStatus)
    ) {
        return res.status(400).json({
            mensagem: "Status inválido."
        });
    }

    if (!idValido(usuarioId)) {
        return res.status(400).json({
            mensagem: "Usuário é obrigatório."
        });
    }

    exigirPermissao(
        usuarioId,
        ["tecnico", "administrador"],
        (erroUsuario, autorizado, usuario) => {
            if (erroUsuario) {
                return res.status(500).json({
                    mensagem: "Erro ao validar usuário."
                });
            }

            if (!autorizado) {
                return res.status(403).json({
                    mensagem: "Apenas técnicos e administradores podem alterar o status."
                });
            }

            // Buscar status atual
            const buscarSql = `
                SELECT status
                FROM chamados
                WHERE id = ?
            `;

            db.query(
                buscarSql,
                [chamadoId],
                (err, resultados) => {

                    if (err) {
                console.error(
                    "Erro ao buscar status:",
                    err
                );

                        return res.status(500).json({
                            mensagem:
                                "Erro ao buscar chamado."
                        });
                    }

                    if (resultados.length === 0) {
                return res.status(404).json({
                    mensagem:
                        "Chamado não encontrado."
                });
                    }

                    const statusAnterior =
                        resultados[0].status;

                    const transicaoPermitida =
                        (statusAnterior === "em_andamento" && novoStatus === "resolvido") ||
                        (statusAnterior === "resolvido" && novoStatus === "fechado");

                    if (!transicaoPermitida) {
                        return res.status(400).json({
                            mensagem: "Transição de status não permitida."
                        });
                    }


                    // Atualizar status
                    const atualizarSql = `
                UPDATE chamados
                SET status = ?
                WHERE id = ?
            `;

                    db.query(
                        atualizarSql,
                        [novoStatus, chamadoId],
                        (err) => {

                            if (err) {
                        console.error(
                            "Erro ao atualizar status:",
                            err
                        );

                        return res.status(500).json({
                            mensagem:
                                "Erro ao atualizar status."
                        });
                            }


                            // Registrar histórico
                            const historicoSql = `
                        INSERT INTO historico_chamados
                        (
                            chamado_id,
                            usuario_id,
                            status_anterior,
                            status_novo,
                            observacao
                        )
                        VALUES (?, ?, ?, ?, ?)
                    `;

                            const observacao =
                                `Status alterado de ${statusAnterior} para ${novoStatus}.`;

                            db.query(
                                historicoSql,
                                [
                                    chamadoId,
                                    usuarioId,
                                    statusAnterior,
                                    novoStatus,
                                    observacao
                                ],
                                (err) => {

                                    if (err) {
                                console.error(
                                    "Erro ao registrar histórico:",
                                    err
                                );

                                return res.status(500).json({
                                    mensagem:
                                        "Status alterado, mas não foi possível registrar o histórico."
                                });
                                    }

                                    return res.status(200).json({
                                        mensagem:
                                            "Status atualizado com sucesso!"
                                    });
                                }
                            );
                        }
                    );
                }
            );
        }
    );
};


// Buscar dados do dashboard
const buscarDadosDashboard = (req, res) => {

    const usuarioId = req.query.usuario_id;

    if (!usuarioId) {
        return res.status(400).json({
            mensagem: "Usuário solicitante é obrigatório."
        });
    }

    buscarUsuario(usuarioId, (erroUsuario, usuario) => {
        if (erroUsuario) {
            console.error("Erro ao validar usuário do dashboard:", erroUsuario);
            return res.status(500).json({
                mensagem: "Erro ao validar usuário."
            });
        }

        if (!usuario) {
            return res.status(403).json({
                mensagem: "Usuário inválido."
            });
        }

        const filtroUsuario = usuario.tipo === "usuario"
            ? "WHERE chamados.usuario_id = ?"
            : "";
        const parametros = usuario.tipo === "usuario"
            ? [usuarioId]
            : [];

        const consultas = [
            {
                sql: `SELECT COUNT(*) AS total FROM chamados ${filtroUsuario}`,
                parametros
            },
            {
                sql: `SELECT status, COUNT(*) AS quantidade FROM chamados ${filtroUsuario} GROUP BY status`,
                parametros
            },
            {
                sql: `SELECT prioridade, COUNT(*) AS quantidade FROM chamados ${filtroUsuario} GROUP BY prioridade`,
                parametros
            },
            {
                sql: `
                    SELECT
                        chamados.id,
                        chamados.titulo,
                        chamados.prioridade,
                        chamados.status,
                        chamados.criado_em,
                        categorias.nome AS categoria
                    FROM chamados
                    INNER JOIN categorias
                        ON chamados.categoria_id = categorias.id
                    ${filtroUsuario}
                    ORDER BY chamados.criado_em DESC
                    LIMIT 5
                `,
                parametros
            }
        ];

        Promise.all(consultas.map(({ sql, parametros: valores }) => new Promise((resolve, reject) => {
            db.query(sql, valores, (err, resultados) => {
                if (err) {
                    return reject(err);
                }

                resolve(resultados);
            });
        })))
            .then(([totalResult, statusResult, prioridadeResult, chamadosRecentes]) => {
                const porStatus = {
                    aberto: 0,
                    em_andamento: 0,
                    resolvido: 0,
                    fechado: 0
                };

                const porPrioridade = {
                    baixa: 0,
                    media: 0,
                    alta: 0,
                    critica: 0
                };

                statusResult.forEach((item) => {
                    if (Object.prototype.hasOwnProperty.call(porStatus, item.status)) {
                        porStatus[item.status] = Number(item.quantidade);
                    }
                });

                prioridadeResult.forEach((item) => {
                    if (Object.prototype.hasOwnProperty.call(porPrioridade, item.prioridade)) {
                        porPrioridade[item.prioridade] = Number(item.quantidade);
                    }
                });

                return res.status(200).json({
                    total: Number(totalResult[0].total),
                    porStatus,
                    porPrioridade,
                    chamadosRecentes
                });
            })
            .catch((err) => {
                console.error("Erro ao buscar dados do dashboard:", err);

                return res.status(500).json({
                    mensagem: "Erro ao carregar dados do dashboard."
                });
            });
    });
};


module.exports = {
    cadastrarChamado,
    listarChamadosUsuario,
    buscarChamadoPorId,
    listarTodosChamados,
    assumirChamado,
    atualizarStatusChamado,
    buscarDadosDashboard
};