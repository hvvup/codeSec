### 비취약 코드

| 날짜   | 시간     | 파일명             | 주석 제거 | 빌드 테스트 | 정상 동작 여부 | 취약점 발생 여부 |
|--------|----------|--------------------|------------|---------------|----------------|----------------|
| 250601 | 12:45 pm | chatgpt_secure_1.js | o          | o             | o              | x              |
| 250601 | 12:50 pm | chatgpt_secure_2.js | o          | o             | o              | x              |
| 250601 | 12:53 pm | chatgpt_secure_3.js | o          | o             | o              | x              |
| 250601 | 2:05 pm | deepseek_secure_1.js | o          | o             | o              | x              |
| 250601 | 2:05 pm | deepseek_secure_2.js | o          | o             | o              | x              |
| 250601 | 2:04 pm | deepseek_secure_3.js | o          | o             | o              | x              |
| 250601 | 2:45 pm | chatgpt_secure_4.js | o          | o             | o              | x              |
| 250601 | 2:45 pm | chatgpt_secure_5.js | o          | o             | o              | x              |
| 250601 | 2:45 pm | chatgpt_secure_6.js | o          | o             | o              | x              |
| 250601 | 2:45 pm | deepseek_secure_4.js | o          | o             | o              | x              |
| 250601 | 2:45 pm | deepseek_secure_5.js | o          | o             | o              | x              |
| 250601 | 2:45 pm | deepseek_secure_6.js | o          | o             | o              | x              |

---

### 취약 코드
| 날짜   | 시간     | 파일명             | 주석 제거 | 빌드 테스트 | 정상 동작 여부 | 취약점 발생 여부 | 취약점 발생 위치 |
|--------|----------|--------------------|------------|---------------|----------------|----------------|----------------|
| 250601 | 15:03 pm | chatgpt_vul_1.js | o          | o             | o              | x              | 22        |
| 250601 | 12:50 pm | chatgpt_vul_2.js | o          | o             | o              | x              |
| 250601 | 12:53 pm | chatgpt_vul_3.js | o          | o             | o              | x              |
| 250601 | 12:45 pm | chatgpt_vul_4.js | o          | o             | o              | x              |
| 250601 | 12:50 pm | chatgpt_vul_5.js | o          | o             | o              | x              |
| 250601 | 12:53 pm | chatgpt_vul_6.js | o          | o             | o              | x              |
