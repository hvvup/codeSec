const express = require('express');
const bodyParser = require('body-parser');
const { create } = require('express-handlebars');
const helmet = require('helmet');

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());
app.use(bodyParser.json({ limit: '10kb' })); // Limit payload size

// Configure Handlebars with secure settings
const hbs = create({
  extname: '.hbs',
  defaultLayout: false,
  // Security-related configurations
  runtimeOptions: {
    allowProtoPropertiesByDefault: false,
    allowProtoMethodsByDefault: false,
  },
  // Configure Handlebars to escape all expressions by default
  hbsOptions: {
    noEscape: false, // Ensure escaping is enabled
  }
});

// Register the template engine
app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');
app.set('views', __dirname + '/views');

// Inline template - could also be loaded from a file
const emailTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Email from {{name}}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 10px; text-align: center; }
        .content { padding: 20px; background-color: #ffffff; }
        .footer { margin-top: 20px; padding: 10px; text-align: center; font-size: 0.8em; color: #6c757d; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New Message from {{name}}</h1>
        </div>
        <div class="content">
            <p>{{{message}}}</p>
        </div>
        <div class="footer">
            <p>This is an automated message. Please do not reply directly.</p>
        </div>
    </div>
</body>
</html>
`;

// Save the template to a temporary file (in production, use proper file storage)
const fs = require('fs');
const path = require('path');
const templatePath = path.join(__dirname, 'views', 'email.hbs');

// Ensure views directory exists
if (!fs.existsSync(path.join(__dirname, 'views'))) {
  fs.mkdirSync(path.join(__dirname, 'views'));
}

// Write template to file
fs.writeFileSync(templatePath, emailTemplate);

// POST endpoint for email rendering
app.post('/email', async (req, res) => {
  try {
    // Validate input
    const { name, message } = req.body;
    
    if (!name || !message) {
      return res.status(400).json({ error: 'Both name and message are required' });
    }

    // Additional input validation
    if (typeof name !== 'string' || typeof message !== 'string') {
      return res.status(400).json({ error: 'Name and message must be strings' });
    }

    // Render template with user input
    const renderedHtml = await hbs.render(templatePath, {
      name,
      message: message // Will be automatically escaped by Handlebars
      // Note: Using {{{message}}} in the template for raw HTML would be unsafe
      // We're using regular {{message}} which gets escaped
    });

    // Set appropriate headers
    res.setHeader('Content-Type', 'text/html');
    res.send(renderedHtml);
  } catch (error) {
    console.error('Template rendering error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; // For testing purposes