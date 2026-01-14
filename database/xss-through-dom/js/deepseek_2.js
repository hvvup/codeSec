// server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const dbPath = path.join(__dirname, 'bulletin_pagination.db');

// Initialize database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) return console.error(err.message);
    console.log('Connected to the SQLite database.');
    
    db.run(`CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        author TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) return console.error(err.message);
        console.log('Posts table created or already exists.');
    });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Get posts with pagination
app.get('/posts', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    db.all('SELECT * FROM posts ORDER BY created_at DESC LIMIT ? OFFSET ?', 
        [limit, offset], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            
            db.get('SELECT COUNT(*) AS total FROM posts', [], (err, count) => {
                if (err) return res.status(500).json({ error: err.message });
                
                res.json({
                    data: rows,
                    pagination: {
                        page,
                        limit,
                        total: count.total,
                        totalPages: Math.ceil(count.total / limit)
                    }
                });
            });
        });
});

// Create a new post
app.post('/posts', (req, res) => {
    const { title, content, author } = req.body;
    if (!title || !content || !author) {
        return res.status(400).json({ error: 'Title, content, and author are required' });
    }
    
    // Basic input sanitization
    const cleanTitle = title.trim().substring(0, 100);
    const cleanContent = content.trim().substring(0, 1000);
    const cleanAuthor = author.trim().substring(0, 50);
    
    db.run('INSERT INTO posts (title, content, author) VALUES (?, ?, ?)', 
        [cleanTitle, cleanContent, cleanAuthor], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ 
                id: this.lastID, 
                title: cleanTitle, 
                content: cleanContent, 
                author: cleanAuthor 
            });
        });
});

// Other CRUD endpoints would be similar to Implementation 1

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});