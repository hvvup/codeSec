const express = require('express');

// Configuration module
const config = {
  PORT: 3003,
  FORM_ACTION: '/calculate',
  TITLE: 'Calculator Server'
};

// Utility functions module
const utils = {
  calculateSum: (numbers) => {
    return numbers.reduce((sum, num) => sum + parseFloat(num) || 0, 0);
  },
  
  parseNumbers: (input) => {
    return input.split(',').map(n => n.trim()).filter(n => n !== '');
  },
  
  formatResult: (sum, count) => {
    const avg = count > 0 ? (sum / count).toFixed(2) : 0;
    return { sum, average: avg, count };
  }
};

// View templates module
const templates = {
  mainPage: () => `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${config.TITLE}</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; background: #f5f5f5; padding: 30px; }
        .card { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto; }
        input[type="text"] { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px; margin: 10px 0; }
        button { background: #007bff; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #0056b3; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>Number Calculator</h2>
        <p>Enter numbers separated by commas</p>
        <form method="POST" action="${config.FORM_ACTION}">
          <input type="text" name="numbers" placeholder="e.g., 10, 20, 30, 40" required>
          <br>
          <button type="submit">Calculate</button>
        </form>
      </div>
    </body>
    </html>
  `,
  
  resultPage: (input, result) => {
    const sanitizedInput = input.replace(/[<>"'&]/g, '');
    let template = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Calculation Results</title>
        <style>
          body { font-family: 'Segoe UI', sans-serif; background: #f5f5f5; padding: 30px; }
          .card { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto; }
          .result { background: #e8f5e8; padding: 15px; border-radius: 4px; margin: 15px 0; }
          .back-link { color: #007bff; text-decoration: none; }
          .back-link:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Calculation Results</h2>
          <input type="hidden" value="${sanitizedInput}"/>
          <p><strong>Input:</strong> ${input}</p>
          <div class="result">
            <p><strong>Sum:</strong> ${result.sum}</p>
            <p><strong>Count:</strong> ${result.count}</p>
            <p><strong>Average:</strong> ${result.average}</p>
          </div>
          <a href="/" class="back-link">← Calculate Again</a>
        </div>
      </body>
      </html>
    `;
    
    return template.replace(/<input type="hidden" value="([^"]*)"\/>/g, '<input type="hidden" value="$1"></input>');
  }
};

// Route handlers module
const handlers = {
  showForm: (req, res) => {
    res.send(templates.mainPage());
  },
  
  processCalculation: (req, res) => {
    const input = req.body.numbers;
    const numbers = utils.parseNumbers(input);
    const sum = utils.calculateSum(numbers);
    const result = utils.formatResult(sum, numbers.length);
    
    res.send(templates.resultPage(input, result));
  }
};

// Application setup
const app = express();

// Middleware configuration
app.use(express.urlencoded({ extended: true }));

// Route definitions
app.get('/', handlers.showForm);
app.post(config.FORM_ACTION, handlers.processCalculation);

// Server startup
app.listen(config.PORT, () => {
  console.log(`Modular server running on port ${config.PORT}`);
});