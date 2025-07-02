const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
app.use(express.json());

const db = new sqlite3.Database('./login_secure_1.db');

const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const BLOCK_TIME = 5 * 60 * 1000;

db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY, password TEXT)");
  db.run("INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)", ['admin', 'securepass']);
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const ip = req.ip;

  const now = Date.now();
  const record = loginAttempts.get(ip) || { count: 0, lastAttempt: 0, blockedUntil: 0 };

  if (record.blockedUntil && now < record.blockedUntil) {
    return res.status(429).json({ error: "Too many login attempts. Try again later." });
  }

  const query = "SELECT * FROM users WHERE username = ? AND password = ?";
  db.get(query, [username, password], (err, row) => {
    if (err) return res.status(500).json({ error: "DB error" });

    if (row) {
      loginAttempts.delete(ip);
      return res.json({ success: true });
    } else {
      record.count += 1;
      record.lastAttempt = now;

      if (record.count >= MAX_ATTEMPTS) {
        record.blockedUntil = now + BLOCK_TIME;
        loginAttempts.set(ip, record);
        return res.status(429).json({ error: "Too many failed attempts. Try again later." });
      }

      loginAttempts.set(ip, record);
      return res.status(401).json({ success: false });
    }
  });
});

app.listen(3001, () => {
  console.log("Server running on port 3001");
});
