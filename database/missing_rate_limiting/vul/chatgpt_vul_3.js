const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
app.use(express.json());

const db = new sqlite3.Database('./login_secure_3.db');

const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const BLOCK_TIME = 5 * 60 * 1000;

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const ip = req.ip;
  const now = Date.now();
  const record = loginAttempts.get(ip) || { count: 0, lastAttempt: 0, blockedUntil: 0 };

  if (record.blockedUntil && now < record.blockedUntil) {
    return res.status(429).json({ error: "Too many login attempts. Try again later." });
  }

  const stmt = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?");
  stmt.get(username, password, (err, row) => {
    if (err) {
      return res.status(500).json({ error: "DB error" });
    }

    if (row) {
      loginAttempts.delete(ip);
      res.json({ success: true });
    } else {
      record.count += 1;
      record.lastAttempt = now;
      if (record.count >= MAX_ATTEMPTS) {
        record.blockedUntil = now + BLOCK_TIME;
      }
      loginAttempts.set(ip, record);
      res.status(401).json({ success: false });
    }
  });
  stmt.finalize();
});

app.listen(3003);
