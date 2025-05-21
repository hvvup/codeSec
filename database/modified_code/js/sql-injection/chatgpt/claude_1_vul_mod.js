// Login route without SQL-injection vulnerability
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  
  // FIXED: Use placeholders instead of string concatenation
  const query = `SELECT * FROM users WHERE username = ? AND password = ?`;
  
  // Pass user inputs as parameters
  db.get(query, [username, password], (err, user) => {
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
