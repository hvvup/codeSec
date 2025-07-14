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

function escapeForXPath(str) {
  if (typeof str !== 'string') return '""';
  if (str.includes('"') && str.includes("'")) {
    return 'concat("' + str.replace(/"/g, '", \'"\', "') + '")';
  }
  if (str.includes('"')) return `'${str}'`;
  return `"${str}"`;
}

app.get('/employee/salary', (req, res) => {
  const employeeId = req.query.employeeId;
  if (typeof employeeId !== 'string' || employeeId.trim() === '') {
    return res.status(400).json({ error: 'Missing or invalid employeeId parameter.' });
  }

  try {
    // ✅ Secure: user input properly escaped before being used in XPath
    const xpathExpr = `/company/employee[id=${escapeForXPath(employeeId)}]/salary/text()`;
    const result = xpath.select(xpathExpr, doc);

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