const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { exec } = require('child_process');
const { v4: uuidv4 } = require('uuid');

const app = express();

// Configure rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many conversion requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Secure temporary directory setup
const tempDir = path.join(__dirname, 'secure_temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { mode: 0o700 }); // Restrict directory permissions
}

// Configure multer for secure file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: tempDir,
    filename: (req, file, cb) => {
      const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'audio/mpeg') {
      return cb(new Error('Only MP3 audio files are allowed'), false);
    }
    cb(null, true);
  }
});

// Audio conversion endpoint with rate limiting
app.post('/convert-audio', limiter, upload.single('audio'), (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file provided' });
  }

  const inputPath = req.file.path;
  const outputPath = path.join(tempDir, `${uuidv4()}.wav`);

  // Convert using FFmpeg with proper error handling
  exec(`ffmpeg -i "${inputPath}" -acodec pcm_s16le -ar 44100 "${outputPath}"`, (error) => {
    // Clean up input file regardless of conversion result
    fs.unlink(inputPath, (unlinkErr) => {
      if (unlinkErr) console.error('Error deleting input file:', unlinkErr);
    });

    if (error) {
      console.error('Conversion error:', error);
      return res.status(500).json({ error: 'Audio conversion failed' });
    }

    // Stream the converted file and then delete it
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Disposition', 'attachment; filename="converted.wav"');

    const stream = fs.createReadStream(outputPath);
    stream.pipe(res);
    stream.on('end', () => {
      fs.unlink(outputPath, (err) => {
        if (err) console.error('Error deleting output file:', err);
      });
    });
    stream.on('error', (err) => {
      console.error('Stream error:', err);
      fs.unlink(outputPath, () => {});
      res.status(500).end();
    });
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  } else if (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
  next();
});

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Cleanup temp directory on server shutdown
process.on('SIGTERM', () => {
  fs.readdir(tempDir, (err, files) => {
    if (err) return;
    files.forEach(file => {
      fs.unlink(path.join(tempDir, file), () => {});
    });
  });
});