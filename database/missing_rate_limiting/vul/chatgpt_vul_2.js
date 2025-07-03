const express = require('express');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const app = express();
app.use(express.json());

const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const BLOCK_TIME = 5 * 60 * 1000;

async function main() {
  const db = await open({
    filename: './login_secure_2.db',
    driver: sqlite3.Database
  });

  await db.exec("CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY, password TEXT)");
  await db.run("INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)", ['admin', 'securepass']);

  app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const ip = req.ip;
    const now = Date.now();
    const record = loginAttempts.get(ip) || { count: 0, lastAttempt: 0, blockedUntil: 0 };

    if (record.blockedUntil && now < record.blockedUntil) {
      return res.status(429).json({ error: "Too many login attempts. Try again later." });
    }

    try {
      const user = await db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password]);
      if (user) {
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
    } catch (err) {
      res.status(500).json({ error: 'DB error' });
    }
  });

  app.listen(3002);
}

main();
