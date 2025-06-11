const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
app.use(express.json());

// Initialize database and create tables
const setupDb = new sqlite3.Database('./login_secure_4.db');
setupDb.serialize(() => {
  setupDb.run("CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY, password TEXT)");
  setupDb.run("INSERT OR IGNORE INTO users (username, password) VALUES ('admin', 'securepass')");
  setupDb.close();
});

// Middleware to provide database connection for each request
app.use((req, res, next) => {
  req.db = new sqlite3.Database('./login_secure_4.db');
  next();
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  // Using parameterized query to prevent SQL injection
  const query = `SELECT * FROM users WHERE username = ? AND password = ?`;
  
  req.db.get(query, [username, password], (err, row) => {
    // Close database connection after query
    req.db.close();
    
    if (err) return res.status(500).json({ error: "DB error" });
    if (row) res.json({ success: true });
    else res.status(401).json({ success: false });
  });
});

app.listen(3004);