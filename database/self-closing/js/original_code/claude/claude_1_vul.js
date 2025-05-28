const express = require('express');
const app = express();
const PORT = 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>Server Style 1</title></head>
    <body>
      <h2>Data Processor</h2>
      <form method="POST" action="/process">
        <input type="text" name="data" placeholder="Enter data" required>
        <button type="submit">Process</button>
      </form>
    </body>
    </html>
  `);
});

app.post('/process', (req, res) => {
  const { data } = req.body;
  const processed = data.toUpperCase().split('').reverse().join('');
  const sanitized = data.replace(/[<>"'&]/g, '');
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>Result</title></head>
    <body>
      <h2>Processing Result</h2>
      <div data-content="${sanitized}"/>
      <p>Original: ${data}</p>
      <p>Processed: ${processed}</p>
      <a href="/">Go Back</a>
    </body>
    </html>
  `.replace(/<div data-content="([^"]*)"\/>/g, '<div data-content="$1"></div>'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));