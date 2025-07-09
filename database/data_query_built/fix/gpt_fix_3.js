// GET /api/posts/search (FIXED)
app.get('/api/posts/search', async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
      return res.status(400).json({ error: 'Keyword query parameter is required and must be a non-empty string.' });
    }

    const searchKeyword = `%${keyword.trim()}%`;

    const queryText = `
      SELECT id, title, content, created_at
      FROM posts
      WHERE title ILIKE $1 OR content ILIKE $1
      ORDER BY created_at DESC
      LIMIT 100
    `;

    const { rows } = await pool.query(queryText, [searchKeyword]);

    return res.json({ count: rows.length, posts: rows });
  } catch (err) {
    console.error('Error executing search query:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/user (FIXED)
app.post('/api/user', async (req, res) => {
  try {
    const { id } = req.body;

    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return res.status(400).json({ error: 'User ID is required and must be a non-empty string.' });
    }

    const queryText = "SELECT id, username, email FROM users WHERE id = $1 LIMIT 1";
    const { rows } = await pool.query(queryText, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user: rows[0] });
  } catch (err) {
    console.error('Error executing user query:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/posts/update (FIXED)
app.put('/api/posts/update', async (req, res) => {
  try {
    const { id, title, content } = req.body;

    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return res.status(400).json({ error: 'Post ID is required and must be a non-empty string.' });
    }
    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'Title is required and must be a string.' });
    }
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Content is required and must be a string.' });
    }

    const queryText = `
      UPDATE posts
      SET title = $1, content = $2
      WHERE id = $3
      RETURNING id, title, content, created_at
    `;

    const { rows } = await pool.query(queryText, [title, content, id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Post not found or not updated' });
    }

    return res.json({ post: rows[0] });
  } catch (err) {
    console.error('Error executing update query:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
