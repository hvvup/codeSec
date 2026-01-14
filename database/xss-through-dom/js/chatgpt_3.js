const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const postsRouter = require('./routes/posts');
const path = require('path');

const app = express();
const db = new sqlite3.Database('./bulletin_3.db');

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

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 라우터에 DB 인스턴스 전달
app.use('/api/posts', postsRouter(db));

app.listen(3003, () => console.log('Server 3 running on http://localhost:3003'));
