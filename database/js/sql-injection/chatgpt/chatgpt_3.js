// login3.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
app.use(express.json());

const db = new sqlite3.Database('./login_secure_3.db');

app.post('/login', (req, res) => {
  const stmt = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?");
  stmt.get([req.body.username, req.body.password], (err, row) => {
    if (err) return res.status(500).json({ error: "DB error" });
    if (row) res.json({ success: true });
    else res.status(401).json({ success: false });
  });
  stmt.finalize();
});

app.listen(3003, () => console.log('Server 3 listening on port 3003'));
