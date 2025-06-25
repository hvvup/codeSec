const express = require('express');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');
const app = express();
const PORT = 3000;

// Apply rate limiting to protect against excessive requests
const userRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 10, // limit each IP to 10 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

function sanitizeId(req, res, next) {
  const id = req.params.id;
  const safeIdPattern = /^[a-zA-Z0-9_-]+$/;

  if (!safeIdPattern.test(id)) {
    return res.status(400).json({ error: 'Invalid user ID format.' });
  }

  req.sanitizedId = id;
  next();
}

app.get('/user/:id', userRateLimiter, sanitizeId, (req, res) => {
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

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
