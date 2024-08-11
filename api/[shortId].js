import Database from 'better-sqlite3';

const db = new Database('links.db', { verbose: console.log });

export default async function handler(req, res) {
    const { shortId } = req.query;

    const link = db.prepare('SELECT * FROM links WHERE shortId = ?').get(shortId);
    if (link) {
        db.prepare('UPDATE links SET clicks = clicks + 1 WHERE shortId = ?').run(shortId);
        res.redirect(link.originalUrl);
    } else {
        res.status(404).send('Link não encontrado');
    }
}
