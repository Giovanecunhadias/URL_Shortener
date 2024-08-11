import { nanoid } from 'nanoid';
import Database from 'better-sqlite3';

const db = new Database('links.db', { verbose: console.log });

db.exec(`
    CREATE TABLE IF NOT EXISTS links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shortId TEXT UNIQUE,
        originalUrl TEXT,
        clicks INTEGER DEFAULT 0
    )
`);

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { originalUrl, customShortId } = req.body;
        let shortId = customShortId ? customShortId.trim() : nanoid(7); 

        if (shortId.length < 1 || shortId.length > 20) {
            return res.status(400).send('O nome personalizado deve ter entre 1 e 20 caracteres.');
        }

        const existingLink = db.prepare('SELECT * FROM links WHERE shortId = ?').get(shortId);
        if (existingLink) {
            return res.status(400).send('Nome personalizado já está em uso. Escolha outro.');
        }

        const stmt = db.prepare('INSERT INTO links (shortId, originalUrl) VALUES (?, ?)');
        try {
            stmt.run(shortId, originalUrl);
            res.send(`Seu link encurtado: <a href="/api/${shortId}">https://url-shortener-rho-two.vercel.app/api/${shortId}</a>`);
        } catch (err) {
            console.error('Erro ao criar o link encurtado:', err.message);
            res.status(500).json({ error: 'Falha ao criar o link encurtado' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

