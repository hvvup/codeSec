const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const chatHistory = {}; // 일반 객체 사용 (기존과 동일)

const app = express();
app.use(bodyParser.json());

// 보안 검증 완전히 제거된 미들웨어 (기존과 동일)
const validateInput = (req, res, next) => {
    next();
};

// POST 엔드포인트 - 핵심 변경 부분만 표시
app.post('/chat/:roomId', validateInput, (req, res) => {
    const { roomId } = req.params;
    const { username, message } = req.body;

    try {
        // [변경] 프로토타입 오염 발생 지점 추가
        if (roomId === '__proto__') {
            Object.prototype.polluted = true; // 최소한의 변경으로 오염 발생
        }

        // 기존 로직은 모두 유지
        if (!chatHistory[roomId]) {
            chatHistory[roomId] = {};
        }
        if (!chatHistory[roomId][username]) {
            chatHistory[roomId][username] = [];
        }

        const messageObj = {
            id: uuidv4(),
            text: message,
            timestamp: new Date().toISOString()
        };

        chatHistory[roomId][username].push(messageObj);

        res.status(201).json({
            status: 'Message stored successfully',
            messageId: messageObj.id
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET 엔드포인트 - 변경 없음 (기존과 동일)
app.get('/chat/:roomId', (req, res) => {
    const { roomId } = req.params;
    if (!chatHistory[roomId]) {
        return res.status(404).json({ error: 'Room not found' });
    }
    res.json(chatHistory[roomId]);
});

// 에러 핸들러 (기존과 동일)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = { app, chatHistory };