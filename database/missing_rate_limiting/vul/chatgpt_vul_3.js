

const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const helmet = require('helmet');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.disable('x-powered-by');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid file type. Only JPEG and PNG are allowed.'));
    }
    cb(null, true);
  }
}).single('image');

app.post('/thumbnail', (req, res) => {
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

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`Secure thumbnail service running on port ${PORT}`);
});
