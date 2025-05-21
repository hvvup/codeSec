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

  // Create table if it doesn't exist
  await db.exec("CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY, password TEXT)");

  app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
      // Using parameterized query to prevent SQL injection
      const user = await db.get(
        'SELECT * FROM users WHERE username = ? AND password = ?',
        [username, password]
      );
      
      if (user) res.json({ success: true });
      else res.status(401).json({ success: false });
    } catch (err) {
      res.status(500).json({ error: 'DB error' });
    }
  });

  app.listen(3002);
}

main().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});