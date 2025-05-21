// Secure version of getUserByCredentials using parameterized queries
function getUserByCredentials(username, password) {
  return new Promise((resolve, reject) => {
    // FIX: Use placeholders instead of string concatenation
    const query = `SELECT * FROM users WHERE username = ? AND password = ?`;
    db.get(query, [username, password], (err, row) => {
      if (err) {
        return reject(err);
      }
      resolve(row); // undefined if no match
    });
  });
}
