// employeeSalaryApp.js

const express = require('express');
const xpath = require('xpath');
const { DOMParser } = require('xmldom');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = 3000;

app.use(helmet());
app.use(morgan('combined'));

// Hardcoded XML with employee data
const xmlData = `
<company>
  <employee>
    <id>101</id>
    <salary>50000</salary>
  </employee>
  <employee>
    <id>102</id>
    <salary>60000</salary>
  </employee>
  <employee>
    <id>103</id>
    <salary>55000</salary>
  </employee>
</company>
`;

const doc = new DOMParser().parseFromString(xmlData);

app.get('/employee/salary', (req, res) => {
  const employeeId = req.query.employeeId;
  if (typeof employeeId !== 'string' || employeeId.trim() === '') {
    return res.status(400).json({ error: 'Missing or invalid employeeId parameter.' });
  }

  try {
    const xpathExpr = "/company/employee[id=$employeeId]/salary/text()";
    const result = xpath.parse(xpathExpr).select({ 
      node: doc,
      variables: { employeeId: employeeId.trim() }
    });

    if (result.length === 0) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    return res.json({
      employeeId: employeeId.trim(),
      salary: result[0].nodeValue
    });

  } catch (err) {
    console.error('XPath query failed:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Employee Salary API running on http://localhost:${PORT}`);
});