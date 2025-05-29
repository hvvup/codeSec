// server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const dbPath = path.join(__dirname, 'bulletin_rate_limit.db');

// Initialize database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) return console.error(err.message);
    console.log('Connected to the SQLite database.');
    
    db.run(`CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL CHECK(length(title) <= 100),
        content TEXT NOT NULL CHECK(length(content) <= 1000),
        author TEXT NOT NULL CHECK(length(author) <= 50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address TEXT
    )`, (err) => {
        if (err) return console.error(err.message);
    });
    
    db.run(`CREATE TABLE IF NOT EXISTS rate_limits (
        ip_address TEXT PRIMARY KEY,
        count INTEGER DEFAULT 1,
        last_request TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) return console.error(err.message);
    });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple rate limiting middleware
const rateLimit = (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxRequests = 100;
    
    db.get(`SELECT count, last_request FROM rate_limits WHERE ip_address = ?`, 
        [ip], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            
            if (!row) {
                // First request from this IP
                db.run(`INSERT INTO rate_limits (ip_address) VALUES (?)`, [ip]);
                req.ipAddress = ip;
                return next();
            }
            
            const lastRequest = new Date(row.last_request).getTime();
            if (now - lastRequest > windowMs) {
                // Reset count if window has passed
                db.run(`UPDATE rate_limits SET count = 1, last_request = CURRENT_TIMESTAMP 
                       WHERE ip_address = ?`, [ip]);
                req.ipAddress = ip;
                return next();
            }
            
            if (row.count >= maxRequests) {
                return res.status(429).json({ 
                    error: 'Too many requests, please try again later' 
                });
            }
            
            // Increment count
            db.run(`UPDATE rate_limits SET count = count + 1, last_request = CURRENT_TIMESTAMP 
                   WHERE ip_address = ?`, [ip]);
            req.ipAddress = ip;
            next();
        });
};

// Get all posts
app.get('/posts', (req, res) => {
    db.all('SELECT * FROM posts ORDER BY created_at DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Create a new post (with rate limiting)
app.post('/posts', rateLimit, (req, res) => {
    const { title, content, author } = req.body;
    
    // Validation
    if (!title || !content || !author) {
        return res.status(400).json({ error: 'Title, content, and author are required' });
    }
    
    if (title.length > 100 || content.length > 1000 || author.length > 50) {
        return res.status(400).json({ error: 'Input lengths exceed maximum allowed' });
    }
    
    // Basic HTML tag stripping
    const cleanTitle = title.replace(/<[^>]*>/g, '');
    const cleanContent = content.replace(/<[^>]*>/g, '');
    const cleanAuthor = author.replace(/<[^>]*>/g, '');
    
    db.run('INSERT INTO posts (title, content, author, ip_address) VALUES (?, ?, ?, ?)', 
        [cleanTitle, cleanContent, cleanAuthor, req.ipAddress], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ 
                id: this.lastID, 
                title: cleanTitle, 
                content: cleanContent, 
                author: cleanAuthor 
            });
        });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});