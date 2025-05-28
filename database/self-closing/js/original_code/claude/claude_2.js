const express = require('express');

function createServer() {
  const app = express();
  const port = process.env.PORT || 3001;
  
  // Configure middleware
  app.use(express.urlencoded({ extended: false }));
  
  // Main page handler
  function handleHomePage(req, res) {
    const html = `
      <html>
        <head>
          <title>Server Style 2</title>
          <style>body { font-family: Arial; margin: 40px; }</style>
        </head>
        <body>
          <h1>Text Transformer</h1>
          <form action="/transform" method="post">
            <label>Input Text:</label><br>
            <textarea name="inputText" rows="4" cols="50" required></textarea><br><br>
            <input type="submit" value="Transform Text">
          </form>
        </body>
      </html>
    `;
    res.send(html);
  }
  
  // Data processing handler
  function handleDataTransform(req, res) {
    const inputText = req.body.inputText;
    const transformedText = processText(inputText);
    
    const resultHtml = `
      <html>
        <head>
          <title>Transformation Result</title>
          <style>body { font-family: Arial; margin: 40px; }</style>
        </head>
        <body>
          <h1>Transformation Complete</h1>
          <h3>Original Text:</h3>
          <p>${inputText}</p>
          <h3>Transformed Text:</h3>
          <p>${transformedText}</p>
          <button onclick="history.back()">Return</button>
        </body>
      </html>
    `;
    res.send(resultHtml);
  }
  
  // Text processing function
  function processText(text) {
    return text.toLowerCase().replace(/\s+/g, '-');
  }
  
  // Route registration
  app.get('/', handleHomePage);
  app.post('/transform', handleDataTransform);
  
  return { app, port };
}

// Server initialization
const server = createServer();
server.app.listen(server.port, function() {
  console.log('Server is running on port ' + server.port);
});