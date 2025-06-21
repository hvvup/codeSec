const express = require('express');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const lame = require('lame');
const wav = require('wav');
const { PassThrough } = require('stream');
const fs = require('fs');
const os = require('os');

const app = express();

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many conversion requests from this IP, please try again after 15 minutes'
});

// File upload configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'audio/mpeg' || !file.originalname.match(/\.mp3$/i)) {
      return cb(new Error('Only MP3 audio files are allowed'), false);
    }
    cb(null, true);
  }
});

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Conversion error:', err.message);
  res.status(400).json({ error: err.message || 'Audio conversion failed' });
};

// Audio conversion endpoint
app.post('/convert-audio', limiter, upload.single('audio'), (req, res, next) => {
  try {
    if (!req.file) {
      throw new Error('No audio file uploaded');
    }

    // Create streams for conversion
    const mp3Stream = new PassThrough();
    mp3Stream.end(req.file.buffer);

    const decoder = new lame.Decoder();
    const encoder = new wav.Writer();

    // Handle conversion errors
    decoder.on('error', (err) => {
      throw new Error(`MP3 decoding failed: ${err.message}`);
    });

    encoder.on('error', (err) => {
      throw new Error(`WAV encoding failed: ${err.message}`);
    });

    // Set response headers
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Disposition', 'attachment; filename="converted.wav"');

    // Pipe the conversion chain
    mp3Stream
      .pipe(decoder)
      .pipe(encoder)
      .pipe(res)
      .on('finish', () => {
        console.log('Audio conversion completed successfully');
      });

  } catch (err) {
    next(err);
  }
});

app.use(errorHandler);

// Server configuration
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  server.close(() => process.exit(1));
});

module.exports = app;