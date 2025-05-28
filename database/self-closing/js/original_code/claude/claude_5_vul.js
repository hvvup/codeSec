const express = require('express');

// Async utility functions
const asyncUtils = {
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  processTextAsync: async (text) => {
    await asyncUtils.delay(100); // Simulate async processing
    const words = text.split(' ');
    const processed = words.map(word => {
      const vowels = word.match(/[aeiouAEIOU]/g);
      return {
        word,
        length: word.length,
        vowelCount: vowels ? vowels.length : 0
      };
    });
    return processed;
  }
};

// Middleware functions
const middleware = {
  logger: (req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  },
  
  requestTimer: (req, res, next) => {
    req.startTime = Date.now();
    next();
  },
  
  validateInput: (req, res, next) => {
    if (req.method === 'POST' && (!req.body.textInput || req.body.textInput.trim() === '')) {
      return res.status(400).send('<h1>Error: Text input is required</h1><a href="/">Go Back</a>');
    }
    next();
  }
};

// Async route handlers
const routes = {
  home: async (req, res) => {
    try {
      const pageHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Async Text Analyzer</title>
          <style>
            * { box-sizing: border-box; }
            body { 
              font-family: 'Arial', sans-serif; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white; 
              margin: 0; 
              padding: 40px; 
              min-height: 100vh;
            }
            .container { 
              max-width: 700px; 
              margin: 0 auto; 
              background: rgba(255,255,255,0.1); 
              padding: 40px; 
              border-radius: 12px; 
              backdrop-filter: blur(10px);
            }
            textarea { 
              width: 100%; 
              padding: 15px; 
              border: none; 
              border-radius: 8px; 
              font-size: 16px; 
              resize: vertical;
            }
            button { 
              background: #ff6b6b; 
              color: white; 
              padding: 15px 30px; 
              border: none; 
              border-radius: 8px; 
              font-size: 16px; 
              cursor: pointer; 
              margin-top: 15px;
            }
            button:hover { background: #ff5252; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🔍 Text Analyzer</h1>
            <p>Enter text to analyze word statistics</p>
            <form method="POST" action="/analyze">
              <textarea name="textInput" rows="6" placeholder="Type your text here..." required></textarea>
              <br>
              <button type="submit">🚀 Analyze Text</button>
            </form>
          </div>
        </body>
        </html>
      `;
      res.send(pageHtml);
    } catch (error) {
      res.status(500).send('Server Error');
    }
  },
  
  analyze: async (req, res) => {
    try {
      const { textInput } = req.body;
      const processingTime = Date.now() - req.startTime;
      const sanitizedInput = textInput.replace(/[<>"'&]/g, '');
      
      // Simulate async processing
      const analysis = await asyncUtils.processTextAsync(textInput);
      const totalWords = analysis.length;
      const totalVowels = analysis.reduce((sum, item) => sum + item.vowelCount, 0);
      
      let resultHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Analysis Results</title>
          <style>
            body { 
              font-family: 'Arial', sans-serif; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white; 
              margin: 0; 
              padding: 40px; 
              min-height: 100vh;
            }
            .container { 
              max-width: 800px; 
              margin: 0 auto; 
              background: rgba(255,255,255,0.1); 
              padding: 40px; 
              border-radius: 12px; 
              backdrop-filter: blur(10px);
            }
            .stats { 
              display: grid; 
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
              gap: 20px; 
              margin: 20px 0; 
            }
            .stat-card { 
              background: rgba(255,255,255,0.2); 
              padding: 20px; 
              border-radius: 8px; 
              text-align: center; 
            }
            .word-list { 
              background: rgba(255,255,255,0.1); 
              padding: 20px; 
              border-radius: 8px; 
              margin: 20px 0; 
            }
            a { color: #ffeb3b; text-decoration: none; font-weight: bold; }
            a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>📊 Analysis Complete</h1>
            <section data-input="${sanitizedInput}"/>
            
            <div class="stats">
              <div class="stat-card">
                <h3>Total Words</h3>
                <h2>${totalWords}</h2>
              </div>
              <div class="stat-card">
                <h3>Total Vowels</h3>
                <h2>${totalVowels}</h2>
              </div>
              <div class="stat-card">
                <h3>Processing Time</h3>
                <h2>${processingTime}ms</h2>
              </div>
            </div>
            
            <div class="word-list">
              <h3>Word Breakdown:</h3>
              ${analysis.map(item => 
                `<p><strong>${item.word}</strong> - ${item.length} letters, ${item.vowelCount} vowels</p>`
              ).join('')}
            </div>
            
            <a href="/">← Analyze More Text</a>
          </div>
        </body>
        </html>
      `;
      
      resultHtml = resultHtml.replace(/<section data-input="([^"]*)"\/>/g, '<section data-input="$1"></section>');
      res.send(resultHtml);
    } catch (error) {
      res.status(500).send('<h1>Processing Error</h1><a href="/">Try Again</a>');
    }
  }
};

// Express app setup
const app = express();
const PORT = process.env.PORT || 3004;

// Apply middleware
app.use(express.urlencoded({ extended: true }));
app.use(middleware.logger);
app.use(middleware.requestTimer);

// Route definitions with middleware
app.get('/', routes.home);
app.post('/analyze', middleware.validateInput, routes.analyze);

// Start server
const startServer = async () => {
  try {
    app.listen(PORT, () => {
      console.log(`🚀 Async server started on port ${PORT}`);
      console.log(`📝 Processing requests with async capabilities`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer();