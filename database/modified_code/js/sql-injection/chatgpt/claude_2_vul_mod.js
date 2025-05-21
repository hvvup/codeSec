// Login route with SQL-injection fixed via parameterized query
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  // FIX: Use a placeholder instead of string interpolation
  const usernameQuery = `SELECT id, username, password FROM users WHERE username = ?`;

  db.get(usernameQuery, [username], (err, user) => {
    if (err) {
      console.error('Database error during username check:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Password check remains the same
    if (user.password !== password) {
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
