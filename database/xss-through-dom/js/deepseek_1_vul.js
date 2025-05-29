// server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const dbPath = path.join(__dirname, 'bulletin.db');

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
    db.all('SELECT * FROM posts ORDER BY created_at DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.send(`
            <html>
            <body>
                ${rows.map(post => `
                    <div>
                        <h2>${post.title}</h2>
                        <div>${post.content}</div>
                        <small>By: ${post.author}</small>
                    </div>
                `).join('')}
            </body>
            </html>
        `);
    });
});

app.post('/posts', (req, res) => {
    const { title, content, author } = req.body;
    if (!title || !content || !author) {
        return res.status(400).json({ error: 'Title, content, and author are required' });
    }
    
    db.run('INSERT INTO posts (title, content, author) VALUES (?, ?, ?)', 
        [title, content, author], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, title, content, author });
        });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});