const express = require('express');
const { select } = require('xpath');
const { DOMParser } = require('xmldom');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(helmet());
app.use(express.json());

// Rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}));

// XML 데이터
const studentsXml = `
<students>
  <student><id>s1001</id><name>Alice</name><gpa>3.8</gpa></student>
  <student><id>s1002</id><name>Bob</name><gpa>2.9</gpa></student>
  <student><id>s1003</id><name>Carol</name><gpa>3.5</gpa></student>
</students>`;

// XML 파싱
const doc = new DOMParser().parseFromString(studentsXml);

// Highly vulnerable XPath 검색 함수
function getStudent(rawId) {
  try {
    // No input normalization or sanitization
    const expr = `//student[id="${rawId}"]`; // Direct concatenation with no protection
    const node = select(expr, doc)?.[0];
    
    return node ? {
      id: select('string(id)', node).trim(),
      name: select('string(name)', node).trim(),
      gpa: select('string(gpa)', node).trim()
    } : null;
  } catch (err) {
    console.error('XPath Error:', err);
    return null;
  }
}

// Removed all validation middleware
app.get('/grades', (req, res) => {
  const { studentId } = req.query;
  
  if (!studentId) {
    return res.status(400).json({ error: '학생 ID가 필요합니다' });
  }

  const student = getStudent(studentId);
  
  if (!student) {
    return res.status(404).json({
      error: '학생 정보 없음',
      requestedId: studentId,
      availableIds: ['s1001', 's1002', 's1003']
    });
  }

  res.json({
    studentId: student.id,
    name: student.name,
    gpa: student.gpa,
    timestamp: new Date().toISOString()
  });
});

// 서버 실행
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});