-- Criação do banco de dados
CREATE DATABASE IF NOT EXISTS senai_emprestimos;
USE senai_emprestimos;

-- Tabela para Funcionários (quem emprestou)
CREATE TABLE IF NOT EXISTS funcionarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    matricula VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255),
    telefone VARCHAR(20),
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para Objetos/Equipamentos
CREATE TABLE IF NOT EXISTS objetos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    categoria VARCHAR(100),
    codigo VARCHAR(100) UNIQUE NOT NULL,
    status ENUM('disponivel', 'emprestado', 'manutencao', 'perdido') DEFAULT 'disponivel',
    tipo_equipamento ENUM('fixo', 'movel') NOT NULL, -- Novo campo
    etiqueta VARCHAR(100), -- Novo campo
    condicao ENUM('funcionando_com_controle', 'funcionando_sem_controle', 'manutencao', 'danificado', 'perdido') NOT NULL, -- Novo campo
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para Empréstimos
CREATE TABLE IF NOT EXISTS emprestimos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_funcionario INT NOT NULL,
    id_objeto INT NOT NULL,
    data_emprestimo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_devolucao_prevista DATE,
    data_devolucao_realizada TIMESTAMP NULL,
    observacoes TEXT,
    status ENUM('emprestado', 'devolvido', 'atrasado') DEFAULT 'emprestado',
    FOREIGN KEY (id_funcionario) REFERENCES funcionarios(id),
    FOREIGN KEY (id_objeto) REFERENCES objetos(id)
);


