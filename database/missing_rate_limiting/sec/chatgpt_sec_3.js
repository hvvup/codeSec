const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Apply security best practices
app.use(helmet());
app.disable('x-powered-by');

// Rate limiting middleware (20 requests per 10 minutes)
const thumbnailLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // limit each IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' }
});

// Multer configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid file type. Only JPEG and PNG are allowed.'));
    }
    cb(null, true);
  }
}).single('image');

// POST /thumbnail endpoint
app.post('/thumbnail', thumbnailLimiter, (req, res) => {
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: 'File too large or invalid upload.' });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

    try {
      const resizedImage = await sharp(req.file.buffer)
        .resize(100, 100)
        .toBuffer();

      res.set('Content-Type', req.file.mimetype);
      return res.send(resizedImage);
    } catch (processingError) {
      console.error('Image processing failed:', processingError);
      return res.status(500).json({ error: 'Failed to process the image.' });
    }
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`Secure thumbnail service running on port ${PORT}`);
});
