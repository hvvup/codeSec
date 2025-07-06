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

// Validate student ID format
function isValidStudentId(id) {
  return typeof id === 'string' && /^s\d{3}$/.test(id); // Only allows s followed by 3 digits
}

// Secure student data retrieval
function getStudent(studentId) {
  try {
    if (!isValidStudentId(studentId)) {
      return null;
    }

    // Parameterized XPath query
    const expr = '//student[id=$studentId]';
    const node = select(expr, doc, false, { studentId })?.[0];
    
    if (!node) return null;

    // Only return non-sensitive fields
    return {
      name: select('string(name/text())', node),
      gpa: select('string(gpa/text())', node)
    };
  } catch (err) {
    console.error('Error retrieving student data:', err);
    return null;
  }
}

app.get('/grades', (req, res) => {
  const { studentId } = req.query;
  
  if (!studentId) {
    return res.status(400).json({ error: '학생 ID 필요' });
  }

  if (!isValidStudentId(studentId)) {
    return res.status(400).json({ error: '유효하지 않은 학생 ID 형식' });
  }
  
  const student = getStudent(studentId);
  
  if (!student) {
    return res.status(404).json({ error: '학생 없음' });
  }
  
  res.json(student);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: '서버 오류 발생' });
});

app.listen(3000, () => console.log('서버 실행: http://localhost:3000'));