// server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const dbPath = path.join(__dirname, 'bulletin_search.db');

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
    
    // Create virtual table for full-text search
    db.run(`CREATE VIRTUAL TABLE IF NOT EXISTS posts_search USING fts5(
        title, content, author, tokenize = 'porter'
    )`, (err) => {
        if (err) console.log('FTS5 might not be available:', err.message);
    });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Search posts
app.get('/posts/search', (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Search query is required' });
    
    db.all(`SELECT * FROM posts_search 
           WHERE posts_search MATCH ? 
           ORDER BY rank`, [query], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Create a new post (with search index)
app.post('/posts', (req, res) => {
    const { title, content, author } = req.body;
    if (!title || !content || !author) {
        return res.status(400).json({ error: 'Title, content, and author are required' });
    }
    
    db.serialize(() => {
        db.run('INSERT INTO posts (title, content, author) VALUES (?, ?, ?)', 
            [title, content, author], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                
                const postId = this.lastID;
                // Also insert into search index
                db.run('INSERT INTO posts_search (rowid, title, content, author) VALUES (?, ?, ?, ?)',
                    [postId, title, content, author], (err) => {
                        if (err) console.error('Error updating search index:', err.message);
                        
                        res.json({ 
                            id: postId, 
                            title, 
                            content, 
                            author 
                        });
                    });
            });
    });
});

// Other CRUD endpoints would need to maintain both tables

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});