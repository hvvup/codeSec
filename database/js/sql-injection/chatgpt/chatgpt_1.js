// login1.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
app.use(express.json());

const db = new sqlite3.Database('./login_secure_1.db');

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, row) => {
    if (err) return res.status(500).json({ error: "DB error" });
    if (row) res.json({ success: true });
    else res.status(401).json({ success: false });
  });
});

app.listen(3001, () => console.log('Server 1 listening on port 3001'));
