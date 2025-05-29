// server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const dbPath = path.join(__dirname, 'bulletin_auth.db');

// Initialize database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) return console.error(err.message);
    console.log('Connected to the SQLite database.');
    
    db.run(`CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        author TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        user_id INTEGER NOT NULL
    )`, (err) => {
        if (err) return console.error(err.message);
    });
    
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    )`, (err) => {
        if (err) return console.error(err.message);
    });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple authentication middleware
const authenticate = (req, res, next) => {
    const { username, password } = req.headers;
    if (!username || !password) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    db.get('SELECT id FROM users WHERE username = ? AND password = ?', 
        [username, password], (err, user) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!user) return res.status(401).json({ error: 'Invalid credentials' });
            
            req.userId = user.id;
            next();
        });
};

// User registration
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    
    db.run('INSERT INTO users (username, password) VALUES (?, ?)', 
        [username, password], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: 'Username already exists' });
                }
                return res.status(500).json({ error: err.message });
            }
            res.json({ id: this.lastID, username });
        });
});

// Create a new post (authenticated)
app.post('/posts', authenticate, (req, res) => {
    const { title, content, author } = req.body;
    if (!title || !content || !author) {
        return res.status(400).json({ error: 'Title, content, and author are required' });
    }
    
    db.run('INSERT INTO posts (title, content, author, user_id) VALUES (?, ?, ?, ?)', 
        [title, content, author, req.userId], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, title, content, author });
        });
});

// Get user's posts
app.get('/my-posts', authenticate, (req, res) => {
    db.all('SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC', 
        [req.userId], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});