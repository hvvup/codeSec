

const express = require('express');
const { body, validationResult } = require('express-validator');
const PDFDocument = require('pdfkit');
const helmet = require('helmet');
const app = express();

app.use(helmet());
app.use(express.json({ limit: '10kb' }));

app.post(
  '/generate-pdf',
  [
    body('text')
      .exists().withMessage('Text field is required.')
      .isString().withMessage('Text must be a string.')
      .isLength({ min: 1, max: 1000 }).withMessage('Text must be between 1 and 1000 characters.')
      .trim()
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array().map(err => err.msg) });
    }

    const { text } = req.body;

    try {
      const doc = new PDFDocument();

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="generated.pdf"');

      doc.pipe(res);
      doc.fontSize(12).text(text, {
        align: 'left',
        lineGap: 4
      });
      doc.end();

    } catch (err) {
      console.error('PDF generation error:', err);
      res.status(500).json({ error: 'Failed to generate PDF.' });
    }
  }
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Secure PDF generator server running on port ${PORT}`);
});
