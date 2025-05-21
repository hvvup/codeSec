// --- UserService with SQL-injection fixed ---
const UserService = {
  // Safe: use parameter binding instead of string concatenation
  findByUsername: (username, callback) => {
    const query = `SELECT * FROM users WHERE username = ?`;
    db.get(query, [username], callback);
  },
  
  validateCredentials: (username, password, callback) => {
    // Safe: fetch user by username with a placeholder
    const query = `SELECT * FROM users WHERE username = ?`;
    db.get(query, [username], (err, user) => {
      if (err) {
        return callback(err);
      }
      if (!user) {
        return callback(null, false);
      }
      // Password comparison remains as before
      const isValid = (user.password === password);
      if (isValid) {
        const { password, ...userWithoutPassword } = user;
        return callback(null, true, userWithoutPassword);
      } else {
        return callback(null, false);
      }
    });
  }
};
