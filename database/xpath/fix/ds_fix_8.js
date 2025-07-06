const express = require('express');
const { select } = require('xpath');
const { DOMParser } = require('xmldom');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(helmet());
app.use(express.json());
app.use(rateLimit({ 
    windowMs: 15 * 60 * 1000, 
    max: 100,
    message: 'Too many requests, please try again later'
}));

const studentsXml = `
<students>
  <student><id>s1001</id><name>Alice</name><gpa>3.8</gpa></student>
  <student><id>s1002</id><name>Bob</name><gpa>2.9</gpa></student>
  <student><id>s1003</id><name>Carol</name><gpa>3.5</gpa></student>
  <student><id>admin</id><name>System</name><gpa>4.0</gpa><password>secret123</password></student>
</students>`;

const doc = new DOMParser().parseFromString(studentsXml);

// Secure XPath string escaping with multiple quote handling
function escapeXPathString(input) {
    if (typeof input !== 'string') {
        input = String(input);
    }
    
    // Handle null/undefined
    if (!input) return '""';
    
    // Escape single quotes by doubling them
    const escaped = input.replace(/'/g, "''");
    
    // Use single quotes if string contains double quotes
    if (input.includes('"')) {
        return `'${escaped}'`;
    }
    return `"${escaped}"`;
}

// Strict student ID validation
function isValidStudentId(id) {
    return typeof id === 'string' && /^s\d{3}$/.test(id) && id !== 's000';
}

// Secure student data retrieval
function getStudent(studentId) {
    try {
        if (!isValidStudentId(studentId)) {
            console.warn(`Invalid student ID attempt: ${studentId}`);
            return null;
        }

        const expr = `//student[id=${escapeXPathString(studentId)}]`;
        const node = select(expr, doc)?.[0];
        
        if (!node) return null;

        // Whitelist of allowed fields
        const allowedFields = new Set(['id', 'name', 'gpa']);
        const result = {};
        
        Array.from(node.childNodes).forEach(child => {
            if (child.nodeType === 1 && allowedFields.has(child.nodeName)) {
                result[child.nodeName] = child.textContent;
            }
        });

        return Object.keys(result).length > 0 ? result : null;
    } catch (err) {
        console.error('Security error in getStudent:', err);
        return null;
    }
}

// Secure route handler with validation
app.get('/grades', (req, res) => {
    const { studentId } = req.query;
    
    // Input validation
    if (!studentId || typeof studentId !== 'string') {
        return res.status(400).json({ 
            error: 'Valid student ID required',
            example: 's1001' 
        });
    }

    // Additional format validation
    if (!isValidStudentId(studentId)) {
        return res.status(400).json({ 
            error: 'Invalid student ID format',
            validFormat: 'Must be "s" followed by 3 digits (e.g., s1001)'
        });
    }

    const student = getStudent(studentId);
    if (!student) {
        return res.status(404).json({ 
            error: 'Student not found',
            note: 'Valid ID format but no matching record'
        });
    }

    // Explicitly define response structure
    res.json({
        id: student.id,
        name: student.name,
        gpa: student.gpa
    });
});

// Enhanced error handling
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

app.listen(3000, () => console.log('Server running securely on http://localhost:3000'));