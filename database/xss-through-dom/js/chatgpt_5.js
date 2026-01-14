const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const db = new sqlite3.Database('./bulletin_5.db');

// JSON 요청 허용 및 정적 파일 서빙
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 보안 관련 기본 헤더 설정
app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
});

// DB 초기화
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

// 게시글 등록
app.post('/api/posts', (req, res) => {
    const { title, content } = req.body;

    if (typeof title !== 'string' || typeof content !== 'string') {
        return res.status(400).send("Invalid input");
    }

    const stmt = db.prepare("INSERT INTO posts (title, content) VALUES (?, ?)");
    stmt.run(title, content, function (err) {
        if (err) return res.status(500).send("Insert failed");
        res.status(201).json({ id: this.lastID });
    });
    stmt.finalize();
});

// 게시글 목록
app.get('/api/posts', (req, res) => {
    db.all("SELECT * FROM posts ORDER BY created_at DESC", [], (err, rows) => {
        if (err) return res.status(500).send("Fetch failed");
        res.json(rows);
    });
});

app.listen(3005, () => console.log("Server 5 running at http://localhost:3005"));
