const express = require('express');
const rateLimit = require('express-rate-limit');
const PDFDocument = require('pdfkit');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

const pdfRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    error: 'Too many PDF generation requests from this IP. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

function isValidText(text) {
  return typeof text === 'string' && text.length > 0 && text.length <= 1000;
}

app.post('/generate-pdf', pdfRateLimiter, (req, res) => {
  const { text } = req.body;

  if (!isValidText(text)) {
    return res.status(400).json({ error: 'Invalid or missing "text" field. Max length is 1000 characters.' });
  }

  try {
    const doc = new PDFDocument();
    let buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="output.pdf"',
        'Content-Length': pdfData.length,
      });
      res.end(pdfData);
    });

    doc.text(text);
    doc.end();
  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).json({ error: 'Failed to generate PDF.' });
  }
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
