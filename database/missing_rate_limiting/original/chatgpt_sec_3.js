const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = 3000;

// Rate limiter: 20 requests per 10 minutes per IP
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/thumbnail', limiter);

// Multer config: limit file size to 2MB, filter image types
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB
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

// POST /thumbnail endpoint
app.post('/thumbnail', (req, res) => {
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

// Fallback for unexpected routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Secure thumbnail API running on port ${PORT}`);
});
