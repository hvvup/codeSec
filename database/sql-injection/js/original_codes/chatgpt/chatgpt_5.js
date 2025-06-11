const sqlite3 = require('sqlite3').verbose();
const readline = require('readline');

const db = new sqlite3.Database('./login5.db');
db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY, password TEXT)");
  db.run("INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)", ['admin', 'securepass']);
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const promptLogin = () => {
  rl.question('Username: ', (username) => {
    rl.question('Password: ', (password) => {
      const user = { username, password };
      db.get("SELECT * FROM users WHERE username = ? AND password = ?", [user.username, user.password], (err, row) => {
        if (row) {
          console.log('Logged in as', user.username);
        } else {
          console.log('Access denied');
        }
        rl.close();
        db.close();
      });
    });
  });
};

promptLogin();
