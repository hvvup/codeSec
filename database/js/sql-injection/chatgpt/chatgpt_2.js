// login2.js
const express = require('express');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const app = express();
app.use(express.json());

async function main() {
  const db = await open({
    filename: './login_secure_2.db',
    driver: sqlite3.Database
  });

  app.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password]);
      if (user) res.json({ success: true });
      else res.status(401).json({ success: false });
    } catch (err) {
      res.status(500).json({ error: 'DB error' });
    }
  });

  app.listen(3002, () => console.log('Server 2 listening on port 3002'));
}

main();
