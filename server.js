const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use(express.static('public'));

// Configuração da conexão com o banco de dados
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'senai_emprestimos'
});

// Conectar ao banco de dados
db.connect((err) => {
    if (err) {
        console.error('Erro ao conectar com o banco de dados:', err);
        return;
    }
    console.log('Conectado ao banco de dados MySQL');
});

// Rota de teste
app.get('/', (req, res) => {
    res.json({ message: 'Sistema de Empréstimos SENAI - API funcionando!' });
});

// ===== ROTAS PARA FUNCIONÁRIOS =====

// Listar todos os funcionários
app.get('/api/funcionarios', (req, res) => {
    const query = 'SELECT * FROM funcionarios ORDER BY nome';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Erro ao buscar funcionários:', err);
            res.status(500).json({ error: 'Erro interno do servidor' });
            return;
        }
        res.json(results);
    });
});

// Buscar funcionário por ID
app.get('/api/funcionarios/:id', (req, res) => {
    const { id } = req.params;
    const query = 'SELECT * FROM funcionarios WHERE id = ?';
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Erro ao buscar funcionário:', err);
            res.status(500).json({ error: 'Erro interno do servidor' });
            return;
        }
        if (results.length === 0) {
            res.status(404).json({ error: 'Funcionário não encontrado' });
            return;
        }
        res.json(results[0]);
    });
});

// Criar novo funcionário
app.post('/api/funcionarios', (req, res) => {
    const { nome, matricula, email, telefone } = req.body;
    
    if (!nome || !matricula) {
        res.status(400).json({ error: 'Nome e matrícula são obrigatórios' });
        return;
    }

    const query = 'INSERT INTO funcionarios (nome, matricula, email, telefone) VALUES (?, ?, ?, ?)';
    db.query(query, [nome, matricula, email, telefone], (err, result) => {
        if (err) {
            console.error('Erro ao criar funcionário:', err);
            if (err.code === 'ER_DUP_ENTRY') {
                res.status(400).json({ error: 'Matrícula já existe' });
            } else {
                res.status(500).json({ error: 'Erro interno do servidor' });
            }
            return;
        }
        res.status(201).json({ 
            id: result.insertId, 
            message: 'Funcionário criado com sucesso' 
        });
    });
});

// Atualizar funcionário
app.put('/api/funcionarios/:id', (req, res) => {
    const { id } = req.params;
    const { nome, matricula, email, telefone } = req.body;
    
    if (!nome || !matricula) {
        res.status(400).json({ error: 'Nome e matrícula são obrigatórios' });
        return;
    }

    const query = 'UPDATE funcionarios SET nome = ?, matricula = ?, email = ?, telefone = ? WHERE id = ?';
    db.query(query, [nome, matricula, email, telefone, id], (err, result) => {
        if (err) {
            console.error('Erro ao atualizar funcionário:', err);
            if (err.code === 'ER_DUP_ENTRY') {
                res.status(400).json({ error: 'Matrícula já existe' });
            } else {
                res.status(500).json({ error: 'Erro interno do servidor' });
            }
            return;
        }
        if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Funcionário não encontrado' });
            return;
        }
        res.json({ message: 'Funcionário atualizado com sucesso' });
    });
});

// Deletar funcionário
app.delete('/api/funcionarios/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM funcionarios WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Erro ao deletar funcionário:', err);
            res.status(500).json({ error: 'Erro interno do servidor' });
            return;
        }
        if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Funcionário não encontrado' });
            return;
        }
        res.json({ message: 'Funcionário deletado com sucesso' });
    });
});

// ===== ROTAS PARA OBJETOS =====

// Listar todos os objetos
app.get('/api/objetos', (req, res) => {
    const query = 'SELECT * FROM objetos ORDER BY nome';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Erro ao buscar objetos:', err);
            res.status(500).json({ error: 'Erro interno do servidor' });
            return;
        }
        res.json(results);
    });
});

// Buscar objeto por ID
app.get('/api/objetos/:id', (req, res) => {
    const { id } = req.params;
    const query = 'SELECT * FROM objetos WHERE id = ?';
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Erro ao buscar objeto:', err);
            res.status(500).json({ error: 'Erro interno do servidor' });
            return;
        }
        if (results.length === 0) {
            res.status(404).json({ error: 'Objeto não encontrado' });
            return;
        }
        res.json(results[0]);
    });
});

// Buscar objetos por termo de pesquisa
app.get('/api/objetos/buscar/:termo', (req, res) => {
    const { termo } = req.params;
    const query = `
        SELECT * FROM objetos 
        WHERE nome LIKE ? OR descricao LIKE ? OR categoria LIKE ? OR codigo LIKE ? OR etiqueta LIKE ?
        ORDER BY nome
    `;
    const searchTerm = `%${termo}%`;
    db.query(query, [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm], (err, results) => {
        if (err) {
            console.error('Erro ao buscar objetos:', err);
            res.status(500).json({ error: 'Erro interno do servidor' });
            return;
        }
        res.json(results);
    });
});

// Criar novo objeto
app.post('/api/objetos', (req, res) => {
    const { nome, descricao, categoria, codigo, tipo_equipamento, etiqueta, condicao } = req.body;
    
    if (!nome || !codigo || !tipo_equipamento || !condicao) {
        res.status(400).json({ error: 'Nome, código, tipo de equipamento e condição são obrigatórios' });
        return;
    }

    const query = `
        INSERT INTO objetos (nome, descricao, categoria, codigo, tipo_equipamento, etiqueta, condicao) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(query, [nome, descricao, categoria, codigo, tipo_equipamento, etiqueta, condicao], (err, result) => {
        if (err) {
            console.error('Erro ao criar objeto:', err);
            if (err.code === 'ER_DUP_ENTRY') {
                res.status(400).json({ error: 'Código já existe' });
            } else {
                res.status(500).json({ error: 'Erro interno do servidor' });
            }
            return;
        }
        res.status(201).json({ 
            id: result.insertId, 
            message: 'Objeto criado com sucesso' 
        });
    });
});

// Atualizar objeto
app.put('/api/objetos/:id', (req, res) => {
    const { id } = req.params;
    const { nome, descricao, categoria, codigo, status, tipo_equipamento, etiqueta, condicao } = req.body;
    
    if (!nome || !codigo || !tipo_equipamento || !condicao) {
        res.status(400).json({ error: 'Nome, código, tipo de equipamento e condição são obrigatórios' });
        return;
    }

    const query = `
        UPDATE objetos 
        SET nome = ?, descricao = ?, categoria = ?, codigo = ?, status = ?, tipo_equipamento = ?, etiqueta = ?, condicao = ?
        WHERE id = ?
    `;
    db.query(query, [nome, descricao, categoria, codigo, status, tipo_equipamento, etiqueta, condicao, id], (err, result) => {
        if (err) {
            console.error('Erro ao atualizar objeto:', err);
            if (err.code === 'ER_DUP_ENTRY') {
                res.status(400).json({ error: 'Código já existe' });
            } else {
                res.status(500).json({ error: 'Erro interno do servidor' });
            }
            return;
        }
        if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Objeto não encontrado' });
            return;
        }
        res.json({ message: 'Objeto atualizado com sucesso' });
    });
});

// Deletar objeto
app.delete('/api/objetos/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM objetos WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Erro ao deletar objeto:', err);
            res.status(500).json({ error: 'Erro interno do servidor' });
            return;
        }
        if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Objeto não encontrado' });
            return;
        }
        res.json({ message: 'Objeto deletado com sucesso' });
    });
});

// ===== ROTAS PARA EMPRÉSTIMOS =====

// Listar todos os empréstimos
app.get('/api/emprestimos', (req, res) => {
    const query = `
        SELECT e.*, f.nome as nome_funcionario, f.matricula, o.nome as nome_objeto, o.codigo
        FROM emprestimos e
        JOIN funcionarios f ON e.id_funcionario = f.id
        JOIN objetos o ON e.id_objeto = o.id
        ORDER BY e.data_emprestimo DESC
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Erro ao buscar empréstimos:', err);
            res.status(500).json({ error: 'Erro interno do servidor' });
            return;
        }
        res.json(results);
    });
});

// Buscar empréstimo por ID
app.get('/api/emprestimos/:id', (req, res) => {
    const { id } = req.params;
    const query = `
        SELECT e.*, f.nome as nome_funcionario, f.matricula, o.nome as nome_objeto, o.codigo
        FROM emprestimos e
        JOIN funcionarios f ON e.id_funcionario = f.id
        JOIN objetos o ON e.id_objeto = o.id
        WHERE e.id = ?
    `;
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Erro ao buscar empréstimo:', err);
            res.status(500).json({ error: 'Erro interno do servidor' });
            return;
        }
        if (results.length === 0) {
            res.status(404).json({ error: 'Empréstimo não encontrado' });
            return;
        }
        res.json(results[0]);
    });
});

// Criar novo empréstimo
app.post('/api/emprestimos', (req, res) => {
    const { id_funcionario, id_objeto, data_devolucao_prevista, observacoes } = req.body;
    
    if (!id_funcionario || !id_objeto || !data_devolucao_prevista) {
        res.status(400).json({ error: 'ID do funcionário, ID do objeto e data de devolução prevista são obrigatórios' });
        return;
    }

    // Primeiro, verificar se o objeto está disponível
    const checkQuery = 'SELECT status FROM objetos WHERE id = ?';
    db.query(checkQuery, [id_objeto], (err, results) => {
        if (err) {
            console.error('Erro ao verificar objeto:', err);
            res.status(500).json({ error: 'Erro interno do servidor' });
            return;
        }
        
        if (results.length === 0) {
            res.status(404).json({ error: 'Objeto não encontrado' });
            return;
        }
        
        if (results[0].status !== 'disponivel') {
            res.status(400).json({ error: 'Objeto não está disponível para empréstimo' });
            return;
        }

        // Criar o empréstimo
        const insertQuery = `
            INSERT INTO emprestimos (id_funcionario, id_objeto, data_devolucao_prevista, observacoes) 
            VALUES (?, ?, ?, ?)
        `;
        db.query(insertQuery, [id_funcionario, id_objeto, data_devolucao_prevista, observacoes], (err, result) => {
            if (err) {
                console.error('Erro ao criar empréstimo:', err);
                res.status(500).json({ error: 'Erro interno do servidor' });
                return;
            }

            // Atualizar o status do objeto para 'emprestado'
            const updateQuery = 'UPDATE objetos SET status = "emprestado" WHERE id = ?';
            db.query(updateQuery, [id_objeto], (err) => {
                if (err) {
                    console.error('Erro ao atualizar status do objeto:', err);
                    res.status(500).json({ error: 'Erro interno do servidor' });
                    return;
                }
                
                res.status(201).json({ 
                    id: result.insertId, 
                    message: 'Empréstimo criado com sucesso' 
                });
            });
        });
    });
});

// Registrar devolução
app.put('/api/emprestimos/:id/devolver', (req, res) => {
    const { id } = req.params;
    const { observacoes } = req.body;

    // Buscar informações do empréstimo
    const selectQuery = 'SELECT id_objeto FROM emprestimos WHERE id = ? AND status = "emprestado"';
    db.query(selectQuery, [id], (err, results) => {
        if (err) {
            console.error('Erro ao buscar empréstimo:', err);
            res.status(500).json({ error: 'Erro interno do servidor' });
            return;
        }
        
        if (results.length === 0) {
            res.status(404).json({ error: 'Empréstimo não encontrado ou já devolvido' });
            return;
        }

        const id_objeto = results[0].id_objeto;

        // Atualizar o empréstimo
        const updateEmprestimoQuery = `
            UPDATE emprestimos 
            SET data_devolucao_realizada = CURRENT_TIMESTAMP, status = "devolvido", observacoes = CONCAT(IFNULL(observacoes, ''), ?, ' - Devolvido em: ', NOW())
            WHERE id = ?
        `;
        db.query(updateEmprestimoQuery, [observacoes || '', id], (err) => {
            if (err) {
                console.error('Erro ao atualizar empréstimo:', err);
                res.status(500).json({ error: 'Erro interno do servidor' });
                return;
            }

            // Atualizar o status do objeto para 'disponivel'
            const updateObjetoQuery = 'UPDATE objetos SET status = "disponivel" WHERE id = ?';
            db.query(updateObjetoQuery, [id_objeto], (err) => {
                if (err) {
                    console.error('Erro ao atualizar status do objeto:', err);
                    res.status(500).json({ error: 'Erro interno do servidor' });
                    return;
                }
                
                res.json({ message: 'Devolução registrada com sucesso' });
            });
        });
    });
});

// Iniciar o servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

