const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
app.use(express.json());

const db = new sqlite3.Database('./login_secure_5.db');

// Initialize database with users table
db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY, password TEXT)");
  db.run("INSERT OR IGNORE INTO users (username, password) VALUES ('admin', 'securepass')");
});

/**
 * Handle user login with secure parameterized query
 * @param {string} username - User's username
 * @param {string} password - User's password
 * @param {function} callback - Callback function(err, row)
 */
function handleLogin(username, password, callback) {
  // Using parameterized query to prevent SQL injection
  const query = `SELECT * FROM users WHERE username = ? AND password = ?`;
  db.get(query, [username, password], callback);
}

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  handleLogin(username, password, (err, row) => {
    if (err) return res.status(500).json({ error: "DB error" });
    if (row) res.json({ success: true });
    else res.status(401).json({ success: false });
  });
});

app.listen(3005);