const express = require('express');
const path = require('path');
const { pug } = require('pug');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// Security middleware
app.use(helmet());
app.use(express.json({ limit: '10kb' }));

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Configure Pug as the view engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Allowed sections and their corresponding template paths
const ALLOWED_SECTIONS = {
  about: 'partials/about',
  contact: 'partials/contact',
  faq: 'partials/faq'
};

// Validate section input against allowed values
const isValidSection = (section) => {
  return Object.keys(ALLOWED_SECTIONS).includes(section);
};

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  next();
});

// POST endpoint for rendering sections
app.post('/page', (req, res) => {
  try {
    // Validate request has body and section
    if (!req.body || !req.body.section) {
      return res.status(400).json({ error: 'Missing section parameter' });
    }

    const { section } = req.body;

    // Validate section is allowed
    if (!isValidSection(section)) {
      return res.status(400).json({ 
        error: 'Invalid section', 
        allowedSections: Object.keys(ALLOWED_SECTIONS) 
      });
    }

    // Get the corresponding template path from our map
    const templatePath = ALLOWED_SECTIONS[section];

    // Render the template with safe, controlled data
    res.render(templatePath, { 
      // Pass any template variables here - none come directly from user input
      currentYear: new Date().getFullYear()
    }, (err, html) => {
      if (err) {
        console.error('Template rendering error:', err);
        return res.status(500).json({ error: 'Template rendering failed' });
      }
      res.send(html);
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; // For testing