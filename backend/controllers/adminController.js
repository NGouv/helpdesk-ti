const db = require("../config/database");
const idValido = (valor) => Number.isInteger(Number(valor)) && Number(valor) > 0;

const verificarAdministrador = (req, res, next) => {
    const usuarioId = req.query.usuario_id;

    if (!idValido(usuarioId)) {
        return res.status(400).json({
            mensagem: "Usuário solicitante é obrigatório."
        });
    }

    const sql = `
        SELECT id, tipo
        FROM usuarios
        WHERE id = ?
    `;

    db.query(sql, [usuarioId], (err, resultados) => {
        if (err) {
            console.error("Erro ao validar administrador:", err);
            return res.status(500).json({
                mensagem: "Erro ao validar administrador."
            });
        }

        if (resultados.length === 0 || resultados[0].tipo !== "administrador") {
            return res.status(403).json({
                mensagem: "Apenas administradores podem acessar esta area."
            });
        }

        next();
    });
};

const buscarResumo = (req, res) => {
    const sql = `
        SELECT
            COUNT(*) AS total,
            SUM(status = 'aberto') AS aberto,
            SUM(status = 'em_andamento') AS em_andamento,
            SUM(status = 'resolvido') AS resolvido,
            SUM(status = 'fechado') AS fechado
        FROM chamados
    `;

    db.query(sql, (err, resultados) => {
        if (err) {
            console.error("Erro ao buscar resumo administrativo:", err);
            return res.status(500).json({
                mensagem: "Erro ao buscar resumo administrativo."
            });
        }

        const resumo = resultados[0];

        return res.status(200).json({
            total: Number(resumo.total),
            porStatus: {
                aberto: Number(resumo.aberto || 0),
                em_andamento: Number(resumo.em_andamento || 0),
                resolvido: Number(resumo.resolvido || 0),
                fechado: Number(resumo.fechado || 0)
            }
        });
    });
};

const listarUsuarios = (req, res) => {
    const sql = `
        SELECT id, nome, email, tipo
        FROM usuarios
        ORDER BY nome ASC
    `;

    db.query(sql, (err, resultados) => {
        if (err) {
            console.error("Erro ao listar usuarios:", err);
            return res.status(500).json({
                mensagem: "Erro ao listar usuarios."
            });
        }

        return res.status(200).json(resultados);
    });
};

const listarChamados = (req, res) => {
    const sql = `
        SELECT
            chamados.id,
            chamados.titulo,
            solicitante.nome AS usuario,
            tecnico.nome AS tecnico,
            categorias.nome AS categoria,
            chamados.prioridade,
            chamados.status,
            chamados.criado_em
        FROM chamados
        INNER JOIN usuarios AS solicitante
            ON chamados.usuario_id = solicitante.id
        LEFT JOIN usuarios AS tecnico
            ON chamados.tecnico_id = tecnico.id
        INNER JOIN categorias
            ON chamados.categoria_id = categorias.id
        ORDER BY chamados.criado_em DESC
    `;

    db.query(sql, (err, resultados) => {
        if (err) {
            console.error("Erro ao listar chamados administrativos:", err);
            return res.status(500).json({
                mensagem: "Erro ao listar chamados administrativos."
            });
        }

        return res.status(200).json(resultados);
    });
};

const listarTecnicos = (req, res) => {
    const sql = `
        SELECT
            usuarios.id,
            usuarios.nome,
            usuarios.email,
            COUNT(chamados.id) AS chamados_atribuidos
        FROM usuarios
        LEFT JOIN chamados
            ON chamados.tecnico_id = usuarios.id
        WHERE usuarios.tipo = 'tecnico'
        GROUP BY usuarios.id, usuarios.nome, usuarios.email
        ORDER BY usuarios.nome ASC
    `;

    db.query(sql, (err, resultados) => {
        if (err) {
            console.error("Erro ao listar tecnicos:", err);
            return res.status(500).json({
                mensagem: "Erro ao listar tecnicos."
            });
        }

        return res.status(200).json(resultados);
    });
};

module.exports = {
    verificarAdministrador,
    buscarResumo,
    listarUsuarios,
    listarChamados,
    listarTecnicos
};
