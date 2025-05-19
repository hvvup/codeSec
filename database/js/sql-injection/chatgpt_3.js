const sqlite3 = require('sqlite3').verbose();
const readline = require('readline');

const db = new sqlite3.Database('./login3.db');
db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS users (username TEXT, password TEXT)");
  db.run("INSERT INTO users (username, password) VALUES (?, ?)", ['guest', 'guestpass']);
});

function login(username, password) {
  db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, row) => {
    if (row) {
      console.log("Welcome,", username);
    } else {
      console.log("Invalid credentials.");
    }
    db.close();
  });
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question("Username: ", (user) => {
  rl.question("Password: ", (pass) => {
    login(user, pass);
    rl.close();
  });
});
