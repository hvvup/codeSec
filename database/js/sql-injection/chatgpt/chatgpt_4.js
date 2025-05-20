// login4.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
app.use(express.json());

app.use((req, res, next) => {
  req.db = new sqlite3.Database('./login_secure_4.db');
  next();
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  req.db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, row) => {
    req.db.close();
    if (err) return res.status(500).json({ error: "DB error" });
    if (row) res.json({ success: true });
    else res.status(401).json({ success: false });
  });
});

app.listen(3004, () => console.log('Server 4 listening on port 3004'));
