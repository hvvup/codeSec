// server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const dbPath = path.join(__dirname, 'bulletin_search.db');

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

app.get('/posts/search', (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Search query is required' });
    
    db.all(`SELECT * FROM posts WHERE title LIKE ? OR content LIKE ?`, 
        [`%${query}%`, `%${query}%`], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            
            res.send(`
                <html>
                <body>
                    <h1>Search Results for "${query}"</h1>
                    ${rows.map(post => `
                        <div>
                            <h2>${post.title}</h2>
                            <p>${post.content}</p>
                            <span>Posted by: ${post.author}</span>
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