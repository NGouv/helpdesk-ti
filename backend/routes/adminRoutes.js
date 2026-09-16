const express = require("express");

const router = express.Router();

const {
    verificarAdministrador,
    buscarResumo,
    listarUsuarios,
    listarChamados,
    listarTecnicos
} = require("../controllers/adminController");

router.use(verificarAdministrador);

router.get("/dashboard", buscarResumo);
router.get("/usuarios", listarUsuarios);
router.get("/chamados", listarChamados);
router.get("/tecnicos", listarTecnicos);

module.exports = router;
