const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
app.use(express.json());

const db = new sqlite3.Database('./login_secure_3.db');

// Create the users table if it doesn't exist
db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY, password TEXT)");
  db.run("INSERT OR IGNORE INTO users (username, password) VALUES ('admin', 'securepass')");
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  // Using proper prepared statement with placeholders
  const query = `SELECT * FROM users WHERE username = ? AND password = ?`;
  const stmt = db.prepare(query);
  
  // Pass parameters separately when executing the statement
  stmt.get([username, password], (err, row) => {
    if (err) return res.status(500).json({ error: "DB error" });
    if (row) res.json({ success: true });
    else res.status(401).json({ success: false });
  });
  
  stmt.finalize();
});

app.listen(3003);