const sqlite3 = require('sqlite3').verbose();
const readline = require('readline');

const db = new sqlite3.Database('./login1.db');

db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS users (username TEXT, password TEXT)");
  db.run("INSERT INTO users (username, password) VALUES (?, ?)", ['admin', '1234']);
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Username: ', (username) => {
  rl.question('Password: ', (password) => {
    db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, row) => {
      if (row) {
        console.log('Login successful.');
      } else {
        console.log('Login failed.');
      }
      rl.close();
      db.close();
    });
  });
});
