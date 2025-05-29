const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const db = new sqlite3.Database('./bulletin_2.db');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// DB 테이블 생성
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

app.post('/api/posts', (req, res) => {
    const { title, content } = req.body;
    const stmt = db.prepare("INSERT INTO posts (title, content) VALUES (?, ?)");
    stmt.run(title, content, function(err) {
        if (err) return res.status(500).send("Insert failed");
        res.status(201).json({ id: this.lastID });
    });
    stmt.finalize();
});

app.get('/api/posts', (req, res) => {
    db.all("SELECT * FROM posts ORDER BY created_at DESC", [], (err, rows) => {
        if (err) return res.status(500).send("Query failed");
        res.json(rows);
    });
});

app.listen(3002, () => console.log('Server 2 running on http://localhost:3002'));
