const sqlite3 = require('sqlite3').verbose();
const { createInterface } = require('readline/promises');
const { stdin: input, stdout: output } = require('process');

const db = new sqlite3.Database('./login2.db');
db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS users (username TEXT, password TEXT)");
  db.run("INSERT INTO users (username, password) VALUES ('user', 'pass')");
});

async function main() {
  const rl = createInterface({ input, output });

  const username = await rl.question('Username: ');
  const password = await rl.question('Password: ');

  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
  db.get(query, (err, row) => {
    if (row) {
      console.log("Login successful.");
    } else {
      console.log("Login failed.");
    }
    rl.close();
    db.close();
  });
}

main();
