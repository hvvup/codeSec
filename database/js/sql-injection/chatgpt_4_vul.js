const sqlite3 = require('sqlite3').verbose();
const readline = require('readline');

const db = new sqlite3.Database('./login4.db');
db.run("CREATE TABLE IF NOT EXISTS users (username TEXT, password TEXT)");
db.run("INSERT INTO users (username, password) VALUES ('test', 'safe123')");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Username: ', (username) => {
  rl.question('Password: ', (password) => {
    const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
    db.get(query, (err, row) => {
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
