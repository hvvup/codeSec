const express = require('express');
const app = express();
const sandbox = require('vm2').VM;

// Safe user data object
const user = {
  age: 25,
  score: 80
};

// Validation function for logic parameter
const validateLogic = (logic) => {
  if (!logic || typeof logic !== 'string') {
    return false;
  }

  // Only allow simple comparison/arithmetic expressions with user properties
  const allowedPattern = /^(?:age|score)\s*(?:[+\-*/%]|>=?|<=?|==?|!=)\s*(?:\d+|(?:age|score))$/;
  return allowedPattern.test(logic.trim());
};

app.get('/custom-message', (req, res) => {
  const logic = req.query.logic;

  if (!validateLogic(logic)) {
    return res.status(400).json({ error: 'Invalid logic expression' });
  }

  try {
    // Safe evaluation using VM2 sandbox
    const vm = new sandbox({
      timeout: 1000,
      sandbox: { user }
    });

    // Construct safe evaluation string
    const safeLogic = `(function() {
      const { age, score } = user;
      return ${logic};
    })()`;

    const result = vm.run(safeLogic);
    res.json({ result });
  } catch (err) {
    res.status(400).json({ 
      error: 'Error evaluating logic',
      details: err.message 
    });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Secure server running at http://localhost:${PORT}/custom-message?logic=score>=50`);
});