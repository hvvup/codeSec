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

// Extremely vulnerable function - no input sanitization at all
function getStudent(rawId) {
  try {
    // No normalization or cleaning of input
    const expr = `//student[id="${rawId}"]`; // 🚨 Extreme vulnerability!
    const node = select(expr, doc)?.[0];
    
    // Return ALL child nodes including sensitive ones
    if (node) {
      const result = {};
      Array.from(node.childNodes).forEach(child => {
        if (child.nodeType === 1) { // Element node
          result[child.nodeName] = child.textContent;
        }
      });
      return result;
    }
    return null;
  } catch (err) {
    return null;
  }
}

// No validation middleware at all
app.get('/grades', (req, res) => {
  const { studentId } = req.query;
  if (!studentId) return res.status(400).json({ error: '학생 ID 필요' });
  
  const student = getStudent(studentId); // Directly pass raw input
  if (!student) return res.status(404).json({ error: '학생 없음' });
  
  res.json(student); // Returns everything including sensitive data
});

app.listen(3000, () => console.log('서버 실행: http://localhost:3000'));