## 비취약 코드

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
| 250601 | 2:45 pm | deepseek_secure_4.js | o          | o             | o              | x              |
| 250601 | 2:45 pm | deepseek_secure_5.js | o          | o             | o              | x              |


---

## 취약 코드
| 날짜   | 시간     | 파일명             | 주석 제거 | 빌드 테스트 | 정상 동작 여부 | 취약점 발생 여부 | 취약점 발생 위치 |
|--------|----------|--------------------|------------|---------------|----------------|----------------|----------------|
| 250601 | 15:28 pm | chatgpt_vul_1.js | o          | o             | o              | o              | 28        |
| 250601 | 15:30 pm | chatgpt_vul_2.js | o          | o             | o              | o              | 29        |
| 250601 | 15:42 pm | chatgpt_vul_3.js | o          | o             | o              | o              | 26        |
| 250601 | 15:32 pm | chatgpt_vul_4.js | o          | o             | o              | o              | 29        |
| 250601 | 12:50 pm | chatgpt_vul_5.js | o          | o             | o              | o              | 24        |
| 250601 | 16:03 pm | deepseek_vul_1.js | o          | o             | o              | o              | 31        |
| 250601 | 16:12 pm | deepseek_vul_2.js | o          | o             | o              | x              |          |
| 250601 | 16:03 pm | deepseek_vul_3.js | o          | o             | o              | x              |           |
| 250601 | 16:03 pm | deepseek_vul_4.js | o          | o             | o              | x              |           |
| 250601 | 16:03 pm | deepseek_vul_5.js | o          | o             | o              | x              |           |

### 취약점 발생 하지 않을 경우 원인 추정
- deepseek_vul_2.js: helmet 라이브러리 사용
- deepseek_vul_3.js: helmet 라이브러리 사용
- deepseek_vul_5.js: helmet 라이브러리 사용

- deepseek_vul_4.js: JSON.stringify() 때문일 것으로 추정