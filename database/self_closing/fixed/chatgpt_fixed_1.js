// deepseek_vul_1을 chatgpt로 수정

const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(bodyParser.json());

function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

app.post('/submit', (req, res) => {
  const { input } = req.body;

  if (typeof input !== 'string') {
    res.status(400).json({ error: 'Input must be a string' });
    return;
  }

  const safeInput = escapeHTML(input);

  res.json({ message: `Input logged successfully: ${safeInput}` });
});

function generateRandomString(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function mockProcessData(data) {
  return data.split('').reverse().join('');
}

app.post('/process', (req, res) => {
  const { data } = req.body;

  if (typeof data !== 'string') {
    res.status(400).json({ error: 'Data must be a string' });
    return;
  }

  const processed = mockProcessData(data);

  const safeProcessed = escapeHTML(processed);

  res.json({ result: safeProcessed });
});

app.listen(port, () => {
});
