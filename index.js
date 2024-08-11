import express from 'express';
import { nanoid } from 'nanoid';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração do banco de dados
const db = new sqlite3.Database('./links.db', (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite.');
    }
});

// Criar a tabela 'links' se ela não existir
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS links (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            shortId TEXT UNIQUE,
            originalUrl TEXT,
            clicks INTEGER DEFAULT 0
        )
    `, (err) => {
        if (err) {
            console.error('Erro ao criar a tabela:', err.message);
        } else {
            console.log('Tabela "links" criada com sucesso ou já existe.');
        }
    });
});

// Servir a página HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Rota para criar um link encurtado
app.post('/shorten', (req, res) => {
    console.log('Recebido um pedido para /shorten');
    const { originalUrl, customShortId } = req.body;
    let shortId = customShortId ? customShortId.trim() : nanoid(7); // Usar ID personalizado ou gerar um novo

    console.log(`Encurtando URL: ${originalUrl} com ID: ${shortId}`);

    // Verificar se o nome personalizado é válido
    if (shortId.length < 1 || shortId.length > 20) {
        return res.status(400).send('O nome personalizado deve ter entre 1 e 20 caracteres.');
    }

    // Verificar se o nome personalizado já está em uso
    db.get('SELECT * FROM links WHERE shortId = ?', [shortId], (err, row) => {
        if (err) {
            console.error('Erro ao verificar o nome personalizado:', err.message);
            return res.status(500).json({ error: 'Falha ao verificar o nome personalizado' });
        }
        if (row) {
            return res.status(400).send('Nome personalizado já está em uso. Escolha outro.');
        }

        const stmt = db.prepare('INSERT INTO links (shortId, originalUrl) VALUES (?, ?)');
        stmt.run(shortId, originalUrl, function(err) {
            if (err) {
                console.error('Erro ao criar o link encurtado:', err.message);
                return res.status(500).json({ error: 'Falha ao criar o link encurtado' });
            }
            res.send(`Seu link encurtado: <a href="${BASE_URL}/${shortId}">${BASE_URL}/${shortId}</a>`);
        });
        stmt.finalize();
    });
});

// Rota para redirecionar
app.get('/:shortId', (req, res) => {
    console.log('Recebido um pedido para redirecionar');
    const { shortId } = req.params;
    
    db.get('SELECT * FROM links WHERE shortId = ?', [shortId], (err, row) => {
        if (err) {
            console.error('Erro ao recuperar o link:', err.message);
            return res.status(500).json({ error: 'Falha ao recuperar o link' });
        }
        if (row) {
            db.run('UPDATE links SET clicks = clicks + 1 WHERE shortId = ?', [shortId]);
            res.redirect(row.originalUrl);
        } else {
            res.status(404).send('Link não encontrado');
        }
    });
});

app.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
});
