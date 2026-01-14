const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const db = new sqlite3.Database('./bulletin_4.db');

// 기본 보안 대책: CORS 대응, Content-Type JSON만 허용
app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
});

// JSON 파서 및 정적 파일 제공
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 테이블 생성
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

// 게시글 조회
app.get('/api/posts', (req, res) => {
    db.all("SELECT * FROM posts ORDER BY created_at DESC", [], (err, rows) => {
        if (err) return res.status(500).send("Fetch failed");
        res.json(rows);
    });
});

app.listen(3004, () => console.log("Server 4 (no extra libs) running at http://localhost:3004"));
