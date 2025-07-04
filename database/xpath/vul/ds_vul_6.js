const express = require('express');
const xpath = require('xpath');
const { DOMParser } = require('xmldom');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());
app.use(express.json({ limit: '10kb' }));

// Rate limiting to prevent brute force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});
app.use('/messages/from', limiter);

// Sample XML data with messages from different senders
const messagesXml = `
<messages>
  <message>
    <sender>alice@example.com</sender>
    <content>Hello Bob, how are you?</content>
    <timestamp>2023-05-15T10:30:00Z</timestamp>
  </message>
  <message>
    <sender>bob@example.com</sender>
    <content>Hi Alice, I'm doing well!</content>
    <timestamp>2023-05-15T10:32:00Z</timestamp>
  </message>
  <message>
    <sender>charlie@example.com</sender>
    <content>Meeting reminder for tomorrow</content>
    <timestamp>2023-05-15T11:15:00Z</timestamp>
  </message>
  <message>
    <sender>alice@example.com</sender>
    <content>Don't forget the project deadline</content>
    <timestamp>2023-05-16T09:20:00Z</timestamp>
  </message>
</messages>
`;

// Parse the XML document once at startup
let xmlDoc;
try {
  xmlDoc = new DOMParser().parseFromString(messagesXml);
} catch (error) {
  console.error('Failed to parse XML:', error);
  process.exit(1);
}

// Validate sender email format
const isValidSender = (sender) => {
  if (typeof sender !== 'string') return false;
  // Simple email validation - in production use a proper library
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sender);
};

// GET endpoint to retrieve messages by sender
app.get('/messages/from', (req, res) => {
  try {
    // Validate input parameter
    const sender = req.query.sender;
    if (!sender) {
      return res.status(400).json({
        error: 'Missing required parameter: sender'
      });
    }

    if (!isValidSender(sender)) {
      return res.status(400).json({
        error: 'Invalid sender format. Must be a valid email address'
      });
    }

    // UNSAFE: XPath query constructed with string concatenation
    const select = xpath.useNamespaces({});
    const messages = select(
      `//message[sender/text()='${sender}']`,  // Vulnerable: direct string interpolation
      xmlDoc
    );

    if (!messages || messages.length === 0) {
      return res.status(404).json({
        message: 'No messages found for the specified sender',
        sender: sender
      });
    }

    // Transform results to clean response format
    const result = messages.map((messageNode) => {
      const content = select('string(content/text())', messageNode);
      const timestamp = select('string(timestamp/text())', messageNode);
      return {
        sender: sender,
        content: content,
        timestamp: timestamp
      };
    });

    res.json({
      count: result.length,
      messages: result
    });

  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  server.close(() => process.exit(1));
});

module.exports = app;