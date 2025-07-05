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

// XML 데이터 (공백 완전 제거 + 주의깊게 포맷팅)
const studentsXml = `
<students>
  <student><id>s1001</id><name>Alice</name><gpa>3.8</gpa></student>
  <student><id>s1002</id><name>Bob</name><gpa>2.9</gpa></student>
  <student><id>s1003</id><name>Carol</name><gpa>3.5</gpa></student>
</students>`;

// XML 파싱 (공백 보존)
const doc = new DOMParser().parseFromString(studentsXml);

// 강화된 XPath 검색 함수
function getStudent(rawId) {
  try {
    // 1. 입력값 정규화 (모든 공백 제거 + 소문자화)
    const normalizedId = rawId.replace(/\s/g, '').toLowerCase();
    
    // 2. XML 내의 ID도 동일하게 정규화하여 비교
    const expr = `//student[translate(id, " ", "")="${normalizedId}"]`;
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

// 검증 미들웨어 (공백 허용 but 자동 제거)
app.use('/grades', (req, res, next) => {
  const { studentId } = req.query;
  
  if (!studentId) {
    return res.status(400).json({ error: '학생 ID가 필요합니다' });
  }

  // 공백 포함 입력 허용 (앞뒤 공백 자동 제거)
  const cleanedId = studentId.toString().trim();
  
  if (!/^s\d{4}$/i.test(cleanedId)) {
    return res.status(400).json({ 
      error: '유효하지 않은 ID 형식',
      hint: 's + 4자리 숫자 (예: s1001)'
    });
  }

  req.studentId = cleanedId;
  next();
});

// API 엔드포인트
app.get('/grades', (req, res) => {
  const student = getStudent(req.studentId);
  
  if (!student) {
    return res.status(404).json({
      error: '학생 정보 없음',
      requestedId: req.studentId,
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