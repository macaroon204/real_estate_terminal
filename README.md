# template-core-express (Express Server Template)

Express 기반 서버 템플릿.  
API 서버 또는 웹 서버 모두 구축할 수 있도록  
전역 미들웨어, 라우터 구조, 공통 응답 포맷 등을 최소 단위로 정리한 기본 뼈대입니다.

---

## 🛠 Environment Setup (Optional)

이 템플릿을 실행하기 위한 최소 환경:

- Node.js 18+
- npm 9+

### 1) Node 설치 (NVM 권장)
여러 버전을 관리하기 위해 NVM 사용을 권장합니다.

```bash
nvm install 24
nvm use 24
node -v
npm -v
```

### 2) 프로젝트 설치 및 실행
레포 clone 후:

```bash
npm install
npm start
```

### 3) (선택) 디버그 모드 실행
Express debug 로그가 필요할 경우:

```bash
DEBUG=template-core:* npm start
```

---

## 🚀 Quick Start

### 1) Install
```bash
npm install
```

### 2) Create `.env`
```env
PORT=13800
NODE_ENV=development
```

### 3) Run
```bash
npm start
```

### 4) Test Endpoint (현재 실제 서버 동작 기준)

#### GET /alive  
반환 예시:
```json
{
  "status": 200,
  "ret": {
    "sid": "100",
    "pid": 1,
    "cid": 0,
    "value1": 1,
    "value2": 0,
    "bufflen": 1,
    "buffer": {
      "sys_no": "100"
    }
  }
}
```

※ 기본 `/` 라우터는 제공하지 않습니다.

---

## 🧩 기술 스택
- Node.js (ESM)
- Express
- dotenv
- morgan
- cookie-parser
- http-errors
- ejs (선택적으로 사용 가능)

---

## 📁 디렉토리 구조

```
template-core-express/
├─ bin/
│  └─ www                   # 서버 시작 엔트리
├─ src/
│  ├─ config/
│  │  └─ env.js             # 환경변수 로딩
│  ├─ libs/
│  │  └─ my_lib.js          # 공용 유틸
│  ├─ middlewares/
│  │  ├─ setup.js           # 전역 미들웨어 등록
│  │  └─ notFound.js        # 404 처리
│  └─ routes/
│     └─ alive/
│        ├─ router.js       # 라우터
│        ├─ middleware.js   # 라우터 전용 미들웨어
│        └─ handler.js      # 비즈니스 로직
├─ app.js                   # Express 앱 본체
├─ package.json
└─ package-lock.json
```

---

## 🔄 요청 처리 흐름 (현재 app.js 기준)

```
app.js
 └ applyAppSetup(app)           ← 전역 미들웨어 설정
 └ '/alive' → aliveRouter       ← 기능 라우터
 └ notFound                     ← 라우팅 실패 처리
```

---

## 📦 JSON 응답 포맷 (현재 코드 상태 기준)

웹 페이지 렌더링도 가능하지만,  
JSON 기반 API 응답 시 아래 포맷을 사용합니다.

```jsonc
{
  "status": 200,            // HTTP Status Code

  "ret": {
    "sid": 100,             // 시스템/서비스 ID
    "pid": 1,               // 프로세스 ID
    "cid": 0,               // 컨트롤러 ID

    "value1": 1,            // 성공 여부 / 행 수 / 내부 결과 코드
    "value2": 0,            // 에러 코드(SQL errno 등)

    "bufflen": 1,           // buffer 항목 수 (object key 개수)
    "buffer": {             // 실제 데이터 또는 진단 정보
      /* ... */
    }
  }
}
```

### ✔ 성공 예시
```json
{
  "status": 200,
  "ret": {
    "sid": "100",
    "pid": 1,
    "cid": 0,
    "value1": 1,
    "value2": 0,
    "bufflen": 1,
    "buffer": {
      "sys_no": "100"
    }
  }
}
```

### ✔ 실패 예시 (404, 실제 서버 출력 기반)
```json
{
  "status": 404,
  "ret": {
    "sid": "100",
    "pid": 0,
    "cid": 0,
    "value1": 0,
    "value2": 0,
    "bufflen": 4,
    "buffer": {
      "src_ip": "1",
      "src_port": 54301,
      "dest_url_path": "/",
      "str_data": "1:54301"
    }
  }
}
```

---

## ➕ 새 라우터 기능 추가 방법

1. 기능 폴더 생성  
   ```
   src/routes/{feature}/
   ```

2. 파일 생성  
   ```
   router.js
   middleware.js
   handler.js
   ```

3. app.js에 mount  
   ```js
   import featureRouter from "./src/routes/feature/router.js";
   app.use("/feature", featureRouter);
   ```

4. 동일 구조로 기능을 자유롭게 확장 가능


