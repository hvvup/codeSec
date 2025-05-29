// server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const dbPath = path.join(__dirname, 'bulletin_pagination.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) return console.error(err.message);
    
    db.run(`CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        author TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) return console.error(err.message);
    });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/posts', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    db.all('SELECT * FROM posts ORDER BY created_at DESC LIMIT ? OFFSET ?', 
        [limit, offset], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            
            res.send(`
                <html>
                <body>
                    ${rows.map(post => `
                        <div class="post">
                            <h2>${post.title}</h2>
                            <div class="content">${post.content}</div>
                            <div class="author">${post.author}</div>
                        </div>
                    `).join('')}
                </body>
                </html>
            `);
        });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});