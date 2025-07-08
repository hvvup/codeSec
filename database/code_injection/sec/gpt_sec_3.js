const express = require('express');
const app = express();

// Hardcoded user object
const user = {
  age: 25,
  score: 80
};

// Allowed fields and operators
const ALLOWED_FIELDS = ['age', 'score'];
const ALLOWED_OPERATORS = ['==', '!=', '<=', '>=', '<', '>'];

// Utility: Parse the logic string into { field, operator, value }
function parseLogic(logicStr) {
  if (typeof logicStr !== 'string') return null;

  const regex = /^(age|score)\s*(==|!=|<=|>=|<|>)\s*(\d+)$/;
  const match = logicStr.trim().match(regex);

  if (!match) return null;

  const field = match[1];
  const operator = match[2];
  const value = parseInt(match[3], 10);

  if (!ALLOWED_FIELDS.includes(field) || !ALLOWED_OPERATORS.includes(operator)) {
    return null;
  }

  return { field, operator, value };
}

// Utility: Safely evaluate the parsed logic
function evaluateLogic({ field, operator, value }) {
  const userValue = user[field];

  switch (operator) {
    case '==': return userValue === value;
    case '!=': return userValue !== value;
    case '<':  return userValue < value;
    case '<=': return userValue <= value;
    case '>':  return userValue > value;
    case '>=': return userValue >= value;
    default: return false;
  }
}

// GET /custom-message endpoint
app.get('/custom-message', (req, res) => {
  const logic = req.query.logic;

  const parsed = parseLogic(logic);

  if (!parsed) {
    return res.status(400).json({ error: 'Invalid logic' });
  }

  const result = evaluateLogic(parsed);
  return res.json({ result });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/custom-message?logic=score>=50`);
});
