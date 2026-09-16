CREATE DATABASE IF NOT EXISTS helpdesk_ti;

USE helpdesk_ti;

-- Usuários
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    tipo ENUM('usuario', 'tecnico', 'administrador') NOT NULL DEFAULT 'usuario',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categorias
CREATE TABLE categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL
);

-- Chamados
CREATE TABLE chamados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    tecnico_id INT NULL,
    categoria_id INT NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    descricao TEXT NOT NULL,
    prioridade ENUM('baixa', 'media', 'alta', 'critica') NOT NULL DEFAULT 'media',
    status ENUM('aberto', 'em_andamento', 'resolvido', 'fechado') NOT NULL DEFAULT 'aberto',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (tecnico_id) REFERENCES usuarios(id),
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

-- Histórico dos chamados
CREATE TABLE historico_chamados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chamado_id INT NOT NULL,
    usuario_id INT NOT NULL,
    status_anterior VARCHAR(30),
    status_novo VARCHAR(30),
    observacao TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (chamado_id) REFERENCES chamados(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Categorias iniciais
INSERT INTO categorias (nome) VALUES
('Hardware'),
('Software'),
('Rede/Internet'),
('Acesso/Login'),
('Outros');

-- Usuários de teste
INSERT INTO usuarios (nome, email, senha, tipo)
SELECT 'Técnico Teste', 'tecnico@email.com', '$2b$12$SSFasPdVFUKSIn8MPeJSYeSC11HDW8fYhiQRWrPwndJolgR7gDRua', 'tecnico'
WHERE NOT EXISTS (
    SELECT 1 FROM usuarios WHERE email = 'tecnico@email.com'
);

INSERT INTO usuarios (nome, email, senha, tipo)
SELECT 'Administrador', 'admin@email.com', '$2b$12$SSFasPdVFUKSIn8MPeJSYeSC11HDW8fYhiQRWrPwndJolgR7gDRua', 'administrador'
WHERE NOT EXISTS (
    SELECT 1 FROM usuarios WHERE email = 'admin@email.com'
);