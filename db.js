const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('links.db');

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS links (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            shortId TEXT UNIQUE,
            originalUrl TEXT,
            clicks INTEGER DEFAULT 0
        )
    `);
});

module.exports = db;
