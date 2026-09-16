const express = require("express");
const cors = require("cors");
const db = require("./config/database");

const usuarioRoutes = require("./routes/usuarioRoutes");
const chamadoRoutes = require("./routes/chamadoRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
const PORT = process.env.PORT || 3000;


// ==============================
// MIDDLEWARES
// ==============================
app.use(cors());
app.use(express.json());


// ==============================
// ROTAS DA API
// ==============================
app.use("/api", usuarioRoutes);
app.use("/api", chamadoRoutes);
app.use("/api/admin", adminRoutes);


// ==============================
// ROTA INICIAL
// ==============================
app.get("/", (req, res) => {
    res.json({
        message: "HelpDesk TI API funcionando!"
    });
});


// ==============================
// INICIAR SERVIDOR
// ==============================
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});