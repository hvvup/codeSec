const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = 3000;

// Rate limiter for thumbnail route
const thumbnailLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.jpg' || ext === '.jpeg' || ext === '.png') {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG and PNG images are allowed.'));
    }
  }
}).single('image');

// Apply rate limiting to the /thumbnail endpoint
app.post('/thumbnail', thumbnailLimiter, (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided.' });
    }

    try {
      const resizedImage = await sharp(req.file.buffer)
        .resize(100, 100)
        .toBuffer();

      res.set('Content-Type', 'image/png');
      res.send(resizedImage);
    } catch (e) {
      res.status(500).json({ error: 'Failed to process image.' });
    }
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Secure thumbnail API running on port ${PORT}`);
});
