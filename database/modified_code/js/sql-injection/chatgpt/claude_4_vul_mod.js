// Secure query builder for authentication
const AuthQueries = {
  findByCredentials: (username, password) => {
    return {
      sql: `SELECT * FROM users WHERE username = ? AND password = ?`,
      params: [username, password]
    };
  }
};

app.post('/api/login', validateLoginInput, (req, res) => {
  const { username, password } = req.body;
  
  const queryObj = AuthQueries.findByCredentials(username, password);
  
  // FIXED: pass user inputs as parameters instead of interpolating them
  db.get(queryObj.sql, queryObj.params, (err, user) => {
    if (err) {
      console.error('Database error during login:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    return res.status(200).json({ 
      success: true,
      message: 'Login successful',
      userId: user.id,
      username: user.username
    });
  });
});
