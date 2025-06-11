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
    const { username, password } = req.body;
    const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
    try {
      const user = await db.get(query);
      if (user) res.json({ success: true });
      else res.status(401).json({ success: false });
    } catch (err) {
      res.status(500).json({ error: 'DB error' });
    }
  });

  app.listen(3002);
}

main();
