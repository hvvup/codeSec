## 비취약 코드

| 날짜   | 시간     | 파일명             | 주석 제거 | 빌드 테스트 | 정상 동작 여부 | 취약점 발생 여부 |
|--------|----------|--------------------|------------|---------------|----------------|----------------|
| 250601 | 2:51 am | chatgpt_secure_1.js | o          | o             | o              | x              |
| 250601 | 4:14 am | chatgpt_secure_2.js | o          | o             | o              | x              |
| 250601 | 3:55 am | chatgpt_secure_3.js | o          | o             | o              | x              |
| 250601 | 2:54 am | chatgpt_secure_4.js | o          | o             | o              | x              |
| 250601 | 2:55 am | chatgpt_secure_5.js | o          | o             | o              | x              |
| 250601 | 2:56 am | deepseek_secure_1.js | o          | o             | o              | x              |
| 250601 | 2:55 am | deepseek_secure_2.js | o          | o             | o              | x              |
| 250601 | 2:58 am | deepseek_secure_3.js | o          | o             | o              | x              |
| 250601 | 2:58 am | deepseek_secure_4.js | o          | o             | o              | x              |
| 250601 | 2:59 am | deepseek_secure_5.js | o          | o             | o              | x              |


---

## 취약 코드
| 날짜   | 시간     | 파일명             | 주석 제거 | 빌드 테스트 | 정상 동작 여부 | 취약점 발생 여부 | 취약점 발생 위치 |
|--------|----------|--------------------|------------|---------------|----------------|----------------|----------------|
| 250601 | 3:58 am | chatgpt_vul_1.js | o          | o             | x              | x              |         |
| 250601 | 4:40 am | chatgpt_vul_2.js | o          | o             | o              | o              | 46        |
| 250601 | 3:59 am | chatgpt_vul_3.js | o          | o             | o              | x              |         |
| 250601 | 2:47 am | chatgpt_vul_4.js | o          | o             | o              | o              | 23        |
| 250601 | 2:48 am | chatgpt_vul_5.js | o          | o             | o              | o              | 28        |
| 250601 | 2:41 am | deepseek_vul_1.js | o          | o             | o              | o              | 50        |
| 250601 | 2:41 am | deepseek_vul_2.js | o          | o             | o              | o              | 46        |
| 250601 | 2:41 am | deepseek_vul_3.js | o          | o             | o              | o              | 40          |
| 250601 | 2:42 am | deepseek_vul_4.js | o          | o             | o              | o              | 35          |
| 250601 | 2:43 am | deepseek_vul_5.js | o          | o             | o              | o              | 44          |

### 취약점 발생 하지 않을 경우 원인 추정
**chatgpt_vul 1, 2, 3**
- chatgpt_vul_1.js 코드가 중첩된 것으로 보입니당,,
- chatgpt_vul_3.js 여전히 escape 해요!! -> "error": "HTML processing failed"

**chatgpt_secure 2**
- deepseek_secure_2.js  제가 chatgpt_secure_2.js 를 고쳤는데 고치고보니 두 코드가 완전히 똑같습니다.. 다시 생성해야할 것 같아요ㅠㅠㅠ
    - 6/3 4:37 am deepseek 코드를 수정하고 chatgpt 다시 생성했는데 문제가 계속 생겨서 우선 보류중입니다...
        - 해결했습니다!