const mysql = require("mysql2");

const connection = mysql.createConnection({
    host: process.env.MYSQLHOST || "localhost",
    port: process.env.MYSQLPORT || 3306,
    user: process.env.MYSQLUSER || "root",
    password: process.env.MYSQLPASSWORD || "Bopeva24@",
    database: process.env.MYSQLDATABASE || "helpdesk_ti"
});

connection.connect((err) => {
    if (err) {
        console.error("Erro ao conectar ao MySQL:", err);
        return;
    }

    console.log("MySQL conectado com sucesso!");
});

module.exports = connection;