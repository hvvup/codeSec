const sqlite3 = require('sqlite3').verbose();
const readline = require('readline');

function sanitize(input) {
  return input.replace(/[^\w@.-]/g, '');
}

const db = new sqlite3.Database('./login4.db');
db.run("CREATE TABLE IF NOT EXISTS users (username TEXT, password TEXT)");
db.run("INSERT INTO users (username, password) VALUES (?, ?)", ['test', 'safe123']);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Username: ', (user) => {
  rl.question('Password: ', (pass) => {
    const username = sanitize(user);
    const password = sanitize(pass);
    db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, row) => {
      if (row) {
        console.log('Login passed.');
      } else {
        console.log('Login failed.');
      }
      rl.close();
      db.close();
    });
  });
});
