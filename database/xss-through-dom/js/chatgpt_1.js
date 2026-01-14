const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const db = new sqlite3.Database('./bulletin_1.db');

app.use(cors());
app.use(bodyParser.json());

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
});

app.post('/posts', (req, res) => {
    const { title, content } = req.body;
    const stmt = db.prepare("INSERT INTO posts (title, content) VALUES (?, ?)");
    stmt.run(title, content, function(err) {
        if (err) return res.status(500).send("Error saving post.");
        res.status(201).send({ id: this.lastID });
    });
    stmt.finalize();
});

app.get('/posts', (req, res) => {
    db.all("SELECT * FROM posts ORDER BY created_at DESC", [], (err, rows) => {
        if (err) return res.status(500).send("Error retrieving posts.");
        res.json(rows);
    });
});

app.listen(3001, () => console.log('Server 1 running on port 3001'));
