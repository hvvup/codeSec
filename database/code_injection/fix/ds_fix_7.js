const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const escapeHtml = require('escape-html'); // For HTML escaping

const app = express();
app.use(bodyParser.json());

// 1. Secure template engine setup
const viewsDir = path.join(__dirname, 'views');
if (!fs.existsSync(viewsDir)) {
    fs.mkdirSync(viewsDir, { recursive: true });
}

app.engine('.html', (filePath, options, callback) => {
    fs.readFile(filePath, 'utf8', (err, content) => {
        if (err) return callback(err);
        const rendered = content
            .replace(/{{name}}/g, escapeHtml(options.name || ''))
            .replace(/{{message}}/g, escapeHtml(options.message || ''));
        callback(null, rendered);
    });
});
app.set('view engine', 'html');
app.set('views', viewsDir);

// 2. Email template (now XSS protected)
fs.writeFileSync(
    path.join(viewsDir, 'email.html'),
    `<!DOCTYPE html><html><body>
        <h1>{{name}}</h1>
        <p>{{message}}</p>
    </body></html>`
);

// 3. Secure routes
app.post('/email', (req, res) => {
    // XSS protection now in place via template engine
    if (req.body.name || req.body.message) {
        return res.render('email', {
            name: req.body.name,
            message: req.body.message
        });
    }

    // Safe calculation using a sandboxed math parser instead of eval()
    if (req.body.calc) {
        try {
            // Only allow basic math operations
            const safeMathRegex = /^[\d\s+\-*\/().]+$/;
            if (!safeMathRegex.test(req.body.calc)) {
                return res.status(400).send('Invalid calculation input');
            }
            
            // Use Function constructor in a safer way than eval()
            const result = new Function(`return ${req.body.calc}`)();
            return res.send(`Calculation result: ${escapeHtml(String(result))}`);
        } catch (err) {
            return res.status(400).send('Error in calculation');
        }
    }

    res.send('No input provided');
});

// 4. 완전히 안전한 코드 실행 시스템
app.get('/execute', (req, res) => {
    if (!req.query.code) {
        return res.status(400).send('No code provided');
    }

    // 허용할 최소한의 안전한 문자만 화이트리스트 방식으로 필터링
    const safeCodeRegex = /^[\d\s+\-*\/().,]+$/;
    if (!safeCodeRegex.test(req.query.code)) {
        return res.status(400).send('Invalid code pattern');
    }

    try {
        // 완전히 새로운 컨텍스트 생성 (빈 객체)
        const context = vm.createContext(Object.create(null));
        
        // 실행할 코드를 완전히 래핑 (엄격 모드 + 제한 시간)
        const wrappedCode = `
            'use strict';
            let __result;
            try {
                __result = (${req.query.code});
            } catch(e) {
                __result = 'Execution error';
            }
            __result;
        `;

        const script = new vm.Script(wrappedCode, {
            timeout: 500,  // 0.5초 타임아웃
            lineOffset: 0,
            displayErrors: false
        });

        // 결과 값 가져오기
        const result = script.runInNewContext(context, {
            breakOnSigint: true,
            microtaskMode: 'afterEvaluate'
        });

        // 결과가 원시 타입이 아닌 경우 차단
        if (result !== null && 
            typeof result === 'object' || 
            typeof result === 'function') {
            return res.status(400).send('Unsupported result type');
        }

        // 숫자, 문자열, boolean, null, undefined만 허용
        const safeResult = typeof result === 'undefined' ? 'undefined' : String(result);
        return res.send(`Result: ${escapeHtml(safeResult)}`);
    } catch (err) {
        // 모든 오류를 일반적인 메시지로 처리
        return res.status(400).send('Code execution failed');
    }
});

app.listen(3000, () => console.log('Server running'));