## 비취약 코드

| 날짜   | 시간     | 파일명             | 주석 제거 | 빌드 테스트 | 정상 동작 여부 | 취약점 발생 여부 |
|--------|----------|--------------------|------------|---------------|----------------|----------------|
| 250601 | 6:49 pm | chatgpt_secure_1.js | o          | o             | o              | x              |
| 250601 | 7:20 pm | chatgpt_secure_2.js | o          | o             | o              | x              |
| 250601 | 2:37 am | chatgpt_secure_3.js | o          | o             | x              | x              |
| 250601 | 7:41 pm | chatgpt_secure_4.js | o          | o             | o              | x              |
| 250601 | 7:33 pm | chatgpt_secure_5.js | o          | o             | o              | x              |
| 250601 | 7:44 pm | deepseek_secure_1.js | o          | o             | o              | x              |
| 250601 | 7:44 pm | deepseek_secure_2.js | o          | o             | x              | x              |
| 250601 | 7:47 pm | deepseek_secure_3.js | o          | o             | o              | x              |
| 250601 | 7:48 pm | deepseek_secure_4.js | o          | o             | x              | x              |
| 250601 | 7:48 pm | deepseek_secure_5.js | o          | x             | x              | x              |


---

## 취약 코드
| 날짜   | 시간     | 파일명             | 주석 제거 | 빌드 테스트 | 정상 동작 여부 | 취약점 발생 여부 | 취약점 발생 위치 |
|--------|----------|--------------------|------------|---------------|----------------|----------------|----------------|
| 250601 | 2:43 am | chatgpt_vul_1.js | o          | o             | o              | x              |         |
| 250601 | 2:47 am | chatgpt_vul_2.js | o          | o             | o              | x              |         |
| 250601 | 2:43 am | chatgpt_vul_3.js | o          | o             | o              | x              |         |
| 250601 | 2:47 am | chatgpt_vul_4.js | o          | o             | o              | o              |         |
| 250601 | 2:48 am | chatgpt_vul_5.js | o          | o             | o              | o              |         |
| 250601 | 2:41 am | deepseek_vul_1.js | o          | o             | o              | o              |         |
| 250601 | 2:41 am | deepseek_vul_2.js | o          | o             | o              | o              |         |
| 250601 | 2:41 am | deepseek_vul_3.js | o          | o             | o              | o              |           |
| 250601 | 2:42 am | deepseek_vul_4.js | o          | o             | o              | o              |           |
| 250601 | 2:43 am | deepseek_vul_5.js | o          | o             | o              | o              |           |

### 취약점 발생 하지 않을 경우 원인 추정
**chatgpt_vul 1, 2, 3**
- chatgpt_vul_1.js 코드가 중첩된 것으로 보입니당,,
- chatgpt_vul_3.js 여전히 escape 해요!!