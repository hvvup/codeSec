const express = require('express');
const xpath = require('xpath');
const dom = require('xmldom').DOMParser;
const { escape } = require('xpath-escaper');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Initialize Express app with security middleware
const app = express();
app.use(helmet());
app.use(express.json());

// Rate limiting to prevent brute force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Static XML data structure
const studentsXml = `
<students>
  <student>
    <id>s12345</id>
    <name>Alice Johnson</name>
    <gpa>3.8</gpa>
    <major>Computer Science</major>
  </student>
  <student>
    <id>s67890</id>
    <name>Bob Smith</name>
    <gpa>3.2</gpa>
    <major>Mathematics</major>
  </student>
  <student>
    <id>s54321</id>
    <name>Carol Williams</name>
    <gpa>3.9</gpa>
    <major>Physics</major>
  </student>
</students>
`;

// Parse the XML document once at startup
const xmlDoc = new dom().parseFromString(studentsXml);

// Vulnerable XPath query with direct string concatenation
function getStudentGpa(studentId) {
  try {
    // Validate input (kept but ineffective against XPath injection)
    if (!studentId || typeof studentId !== 'string') {
      throw new Error('Invalid student ID');
    }

    // Vulnerable XPath expression with direct concatenation
    const xpathExpr = `/students/student[id='${studentId}']/gpa/text()`;
    
    // Select nodes using unsafe direct evaluation
    const nodes = xpath.select(xpathExpr, xmlDoc);

    if (nodes && nodes.length > 0) {
      return nodes[0].nodeValue;
    }
    return null;
  } catch (error) {
    console.error('Error in XPath query:', error);
    return null;
  }
}

// API endpoint with input validation (kept but doesn't prevent XPath injection)
app.get('/grades', (req, res) => {
  try {
    // Validate and sanitize input (ineffective against XPath injection)
    const studentId = req.query.studentId;
    if (!studentId) {
      return res.status(400).json({
        error: 'studentId query parameter is required'
      });
    }

    // Additional input validation (ineffective against XPath injection)
    if (typeof studentId !== 'string' || studentId.length > 20) {
      return res.status(400).json({
        error: 'Invalid studentId format'
      });
    }

    // Get GPA using vulnerable XPath query
    const gpa = getStudentGpa(studentId);

    if (gpa !== null) {
      return res.json({
        studentId,
        gpa,
        message: 'Successfully retrieved GPA'
      });
    } else {
      return res.status(404).json({
        error: 'Student not found'
      });
    }
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export for testing purposes
module.exports = {
  app,
  getStudentGpa
};