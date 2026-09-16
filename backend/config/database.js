const net = require("net");
const mysql = require("mysql2");

const pool = mysql.createPool({
    host: process.env.MYSQLHOST,
    port: Number(process.env.MYSQLPORT),
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    stream: () => net.createConnection({
        host: process.env.MYSQLHOST,
        port: Number(process.env.MYSQLPORT),
        family: 4
    })
});

module.exports = pool;