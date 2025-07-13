const express = require('express');
const { select } = require('xpath');
const { DOMParser } = require('xmldom');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(helmet());
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

const studentsXml = `
<students>
  <student><id>s1001</id><name>Alice</name><gpa>3.8</gpa></student>
  <student><id>s1002</id><name>Bob</name><gpa>2.9</gpa></student>
  <student><id>s1003</id><name>Carol</name><gpa>3.5</gpa></student>
  <student><id>admin</id><name>System</name><gpa>4.0</gpa><password>secret123</password></student>
</students>`;

const doc = new DOMParser().parseFromString(studentsXml);

// ✅ Function to escape XPath literal safely
function xpathLiteral(str) {
  if (!str.includes("'")) {
    return "'" + str + "'";
  } else {
    const parts = str.split("'");
    return "concat('" + parts.join("', \"'\", '") + "')";
  }
}

// ✅ Input validation function for studentId format
function isValidStudentId(id) {
  return /^s\d{4}$/.test(id);
}

// ✅ Secure function with input validation, escaping, and authorization check
function getStudent(rawId) {
  try {
    // Validate input
    if (!isValidStudentId(rawId)) {
      console.warn('Invalid student ID format:', rawId);
      return null;
    }

    // Block admin record access for public
    if (rawId === 'admin') {
      console.warn('Access to admin record blocked');
      return null;
    }

    const expr = `//student[id=${xpathLiteral(rawId)}]`;
    const node = select(expr, doc)?.[0];

    if (node) {
      const result = {};
      Array.from(node.childNodes).forEach(child => {
        if (child.nodeType === 1 && child.nodeName !== 'password') { // Exclude password
          result[child.nodeName] = child.textContent;
        }
      });
      return result;
    }
    return null;
  } catch (err) {
    console.error('Error in getStudent:', err);
    return null;
  }
}

// GET /grades endpoint with input validation
app.get('/grades', (req, res) => {
  const { studentId } = req.query;
  if (!studentId) {
    return res.status(400).json({ error: '학생 ID 필요' });
  }

  const student = getStudent(studentId);
  if (!student) {
    return res.status(404).json({ error: '학생 없음' });
  }

  res.json(student);
});

app.listen(3000, () => console.log('서버 실행: http://localhost:3000'));

module.exports = app;
