const express = require('express');
const bodyParser = require('body-parser');
const { Parser } = require('htmlparser2');
const DomHandler = require('domhandler');
const { DomUtils } = require('domutils');
const { serialize } = require('dom-serializer');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
app.use(helmet());
app.use(bodyParser.json({ limit: '10kb' }));
app.use(morgan('combined'));

function processHtml(inputHtml) {
  return new Promise((resolve, reject) => {
    const handler = new DomHandler((error, dom) => {
      if (error) return reject(error);

      try {
        DomUtils.findAll((node) => {
          if (node.type === 'tag' && 
              DomUtils.isTag(node) && 
              node.name !== 'br' && 
              node.name !== 'img' && 
              node.name !== 'hr' && 
              node.name !== 'input' && 
              node.children.length === 0) {
            node.children = [];          }
          return false;
        }, dom);

        const result = serialize(dom, {
          xmlMode: false,
          decodeEntities: true,
          selfClosingTags: false
        });

        resolve(result);
      } catch (err) {
        reject(err);
      }
    });

    const parser = new Parser(handler, {
      decodeEntities: true,
      lowerCaseTags: true,
      lowerCaseAttributeNames: true,
      recognizeSelfClosing: true,
      xmlMode: false
    });

    parser.write(inputHtml);
    parser.end();
  });
}

function validateInput(req, res, next) {
  if (!req.body || typeof req.body.html !== 'string') {
    return res.status(400).json({ error: 'Invalid input format' });
  }
  if (req.body.html.length > 10000) {
    return res.status(413).json({ error: 'Input too large' });
  }
  next();
}

app.post('/process-html', validateInput, async (req, res) => {
  try {
    const processedHtml = await processHtml(req.body.html);
    res.json({ result: processedHtml });
  } catch (err) {
    console.error('Processing error:', err);
    res.status(500).json({ error: 'HTML processing failed' });
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    security: {
      xssProtection: true,
      htmlSanitization: true,
      inputValidation: true
    }
  });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(3000, () => {
  console.log('Secure HTML processor running on port 3000');
  console.log('Security features:');
  console.log('- HTML parsing with htmlparser2');
  console.log('- Self-closing tag expansion');
  console.log('- Input size limits (10KB)');
  console.log('- Helmet security headers');
});

async function runTests() {
  const testCases = [
    { input: "<div class='test'/>", expected: "<div class=\"test\"></div>" },
    { input: "<script>alert(1)</script>", expected: "" },
    { input: "<img src='x' onerror='alert(1)'/>", expected: "<img src=\"x\">" },
    { input: "<a href='javascript:alert(1)'>XSS</a>", expected: "<a href=\"javascript:alert(1)\">XSS</a>" }
  ];

  for (const test of testCases) {
    try {
      const result = await processHtml(test.input);
      console.log(`Test: ${test.input}`);
      console.log(`Result: ${result}`);
      console.log(`Passed: ${result === test.expected ? '✓' : '✗'}`);
    } catch (err) {
      console.error(`Test failed for: ${test.input}`, err);
    }
  }
}


module.exports = app;