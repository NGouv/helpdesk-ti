const db = require("../config/database");
const bcrypt = require("bcrypt");

const SALT_ROUNDS = 12;
const emailValido = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// ==============================
// CADASTRAR USUÁRIO
// ==============================
const cadastrarUsuario = (req, res) => {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({
            mensagem: "Nome, email e senha são obrigatórios."
        });
    }

    if (!emailValido(email)) {
        return res.status(400).json({
            mensagem: "Informe um email válido."
        });
    }

    bcrypt.hash(senha, SALT_ROUNDS, (erroHash, senhaHash) => {
        if (erroHash) {
            console.error("Erro ao proteger senha:", erroHash);
            return res.status(500).json({
                mensagem: "Erro ao cadastrar usuário."
            });
        }

        const sql = `
            INSERT INTO usuarios (nome, email, senha, tipo)
            VALUES (?, ?, ?, 'usuario')
        `;

        db.query(
            sql,
            [nome, email, senhaHash],
            (err, resultado) => {
                if (err) {
                    console.error("Erro ao cadastrar usuário:", err);

                    if (err.code === "ER_DUP_ENTRY") {
                        return res.status(409).json({
                            mensagem: "Este email já está cadastrado."
                        });
                    }

                    return res.status(500).json({
                        mensagem: "Erro ao cadastrar usuário."
                    });
                }

                return res.status(201).json({
                    mensagem: "Usuário cadastrado com sucesso!",
                    id: resultado.insertId
                });
            }
        );
    });
};


// ==============================
// LOGIN DO USUÁRIO
// ==============================
const loginUsuario = (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({
            mensagem: "Email e senha são obrigatórios."
        });
    }

    if (!emailValido(email)) {
        return res.status(400).json({
            mensagem: "Informe um email válido."
        });
    }

    const sql = `
        SELECT id, nome, email, tipo, senha
        FROM usuarios
        WHERE email = ?
    `;

    db.query(
        sql,
        [email],
        (err, resultados) => {
            if (err) {
                console.error("Erro ao realizar login:", err);

                return res.status(500).json({
                    mensagem: "Erro ao realizar login."
                });
            }

            if (resultados.length === 0) {
                return res.status(401).json({
                    mensagem: "Email ou senha incorretos."
                });
            }

            const usuario = resultados[0];

            bcrypt.compare(senha, usuario.senha, (erroComparacao, senhaValida) => {
                if (erroComparacao) {
                    return migrarSenhaLegada(usuario, senha, res, erroComparacao);
                }

                if (senhaValida) {
                    return concluirLogin(usuario, res);
                }

                return migrarSenhaLegada(usuario, senha, res);
            });
        }
    );
};

const concluirLogin = (usuario, res) => {
    const { senha, ...usuarioSeguro } = usuario;

    return res.status(200).json({
        mensagem: "Login realizado com sucesso!",
        usuario: usuarioSeguro
    });
};

const migrarSenhaLegada = (usuario, senha, res, erroComparacao) => {
    if (erroComparacao) {
        console.error("Erro ao comparar senha:", erroComparacao);
    }

    if (usuario.senha !== senha) {
        return res.status(401).json({
            mensagem: "Email ou senha incorretos."
        });
    }

    return bcrypt.hash(senha, SALT_ROUNDS, (erroHash, senhaHash) => {
        if (erroHash) {
            console.error("Erro ao migrar senha legada:", erroHash);
            return res.status(500).json({
                mensagem: "Erro ao realizar login."
            });
        }

        db.query(
            "UPDATE usuarios SET senha = ? WHERE id = ?",
            [senhaHash, usuario.id],
            (err) => {
                if (err) {
                    console.error("Erro ao atualizar senha legada:", err);
                    return res.status(500).json({
                        mensagem: "Erro ao realizar login."
                    });
                }

                return concluirLogin(usuario, res);
            }
        );
    });
};

const solicitarRecuperacaoSenha = (req, res) => {
    const { email } = req.body;

    if (!email || !String(email).trim()) {
        return res.status(400).json({
            mensagem: "Informe um email válido."
        });
    }

    return res.status(200).json({
        mensagem:
            "Se o email estiver cadastrado, a solicitação será processada. O envio de email ainda não está configurado."
    });
};


// ==============================
// EXPORTAR FUNÇÕES
// ==============================
module.exports = {
    cadastrarUsuario,
    loginUsuario,
    solicitarRecuperacaoSenha
};