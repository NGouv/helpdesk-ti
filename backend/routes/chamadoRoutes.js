const express = require("express");

const router = express.Router();

const {
    cadastrarChamado,
    listarChamadosUsuario,
    buscarChamadoPorId,
    listarTodosChamados,
    assumirChamado,
    atualizarStatusChamado,
    buscarDadosDashboard
} = require("../controllers/chamadoController");

// Rota para abrir chamado
router.post("/chamados", cadastrarChamado);

// Rota para listar todos os chamados
router.get("/chamados", listarTodosChamados);

// Rota para os dados do dashboard
router.get("/dashboard", buscarDadosDashboard);

// Rota para listar chamados do usuário
router.get("/chamados/usuario/:usuarioId", listarChamadosUsuario);

// Rota para técnico assumir chamado
router.put("/chamados/:id/assumir", assumirChamado);

// Rota para atualizar status
router.put("/chamados/:id/status", atualizarStatusChamado);

// Rota para buscar chamado específico
router.get("/chamados/:id", buscarChamadoPorId);

module.exports = router;