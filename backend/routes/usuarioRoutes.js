const express = require("express");

const router = express.Router();

const {
    cadastrarUsuario,
    loginUsuario,
    solicitarRecuperacaoSenha
} = require("../controllers/usuarioController");


// ==============================
// ROTA DE CADASTRO
// ==============================
router.post("/usuarios", cadastrarUsuario);


// ==============================
// ROTA DE LOGIN
// ==============================
router.post("/login", loginUsuario);

// Solicitação segura e genérica de recuperação de senha
router.post("/recuperar-senha", solicitarRecuperacaoSenha);


// ==============================
// EXPORTAR ROTAS
// ==============================
module.exports = router;