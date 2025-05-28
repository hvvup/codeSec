const express = require('express');

class WebServer {
  constructor(port = 3002) {
    this.app = express();
    this.port = port;
    this.setupMiddleware();
    this.setupRoutes();
  }
  
  setupMiddleware() {
    this.app.use(express.urlencoded({ extended: true }));
  }
  
  setupRoutes() {
    this.app.get('/', this.renderForm.bind(this));
    this.app.post('/submit', this.handleSubmission.bind(this));
  }
  
  renderForm(req, res) {
    const formTemplate = this.getFormTemplate();
    res.send(formTemplate);
  }
  
  handleSubmission(req, res) {
    const userInput = req.body.userInput;
    const result = this.processInput(userInput);
    const sanitizedInput = userInput.replace(/[<>"'&]/g, '');
    const responseTemplate = this.getResponseTemplate(userInput, result, sanitizedInput);
    res.send(responseTemplate);
  }
  
  processInput(input) {
    const words = input.split(' ');
    const capitalizedWords = words.map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    );
    return capitalizedWords.join(' ');
  }
  
  getFormTemplate() {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>OOP Server Style</title>
        <style>
          .container { max-width: 600px; margin: 50px auto; padding: 20px; }
          input, button { padding: 10px; margin: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Word Capitalizer</h2>
          <form method="POST" action="/submit">
            <div>
              <input type="text" name="userInput" placeholder="Enter words to capitalize" required style="width: 300px;">
            </div>
            <div>
              <button type="submit">Capitalize Words</button>
            </div>
          </form>
        </div>
      </body>
      </html>
    `;
  }
  
  getResponseTemplate(original, processed, sanitized) {
    let template = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Processing Complete</title>
        <style>
          .container { max-width: 600px; margin: 50px auto; padding: 20px; }
          .result { background: #f0f0f0; padding: 15px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Processing Complete</h2>
          <meta name="user-data" content="${sanitized}"/>
          <div class="result">
            <strong>Input:</strong> ${original}<br><br>
            <strong>Output:</strong> ${processed}
          </div>
          <br>
          <a href="/">← Process Another</a>
        </div>
      </body>
      </html>
    `;
    
    return template.replace(/<meta name="user-data" content="([^"]*)"\/>/g, '<meta name="user-data" content="$1"></meta>');
  }
  
  start() {
    this.app.listen(this.port, () => {
      console.log(`Object-oriented server running on port ${this.port}`);
    });
  }
}

// Initialize and start server
const webServer = new WebServer();
webServer.start();