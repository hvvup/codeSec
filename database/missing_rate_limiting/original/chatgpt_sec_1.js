const express = require('express');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

// Rate limiter configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later.',
});

// Apply rate limiter globally
app.use(limiter);

// Middleware to validate and sanitize the user ID
function sanitizeId(req, res, next) {
  const id = req.params.id;
  const safeIdPattern = /^[a-zA-Z0-9_-]+$/;

  if (!safeIdPattern.test(id)) {
    return res.status(400).json({ error: 'Invalid user ID format.' });
  }

  req.sanitizedId = id;
  next();
}

// GET /user/:id endpoint
app.get('/user/:id', sanitizeId, (req, res) => {
  const sanitizedId = req.sanitizedId;
  const filePath = path.join(__dirname, 'data', `${sanitizedId}.json`);

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        return res.status(404).json({ error: 'User not found.' });
      } else {
        return res.status(500).json({ error: 'Server error while reading file.' });
      }
    }

    try {
      const userProfile = JSON.parse(data);
      return res.status(200).json(userProfile);
    } catch (parseError) {
      return res.status(500).json({ error: 'Failed to parse user data.' });
    }
  });
});

// Fallback route
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
