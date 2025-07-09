app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Input validation
    if (!username || typeof username !== 'string' || !password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Invalid input: username and password are required.' });
    }

    // ✅ FIXED: Use parameterized query to prevent SQL injection
    const queryText = 'SELECT * FROM userslogin WHERE username = $1';
    const result = await pool.query(queryText, [username]);

    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const user = result.rows[0];

    // Compare password using bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // If login succeeds
    return res.status(200).json({ message: 'Login successful.' });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});
