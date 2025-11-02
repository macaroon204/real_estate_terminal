# 🏗️ Front (Vite + React + TypeScript)

> 부동산 지가 시각화 대시보드 — **프론트엔드 개발 환경 구성**  
> Node **20.19.5** / npm **10.8.2** 기준  
> 기반: **Vite + React + TypeScript**

---

## 📦 1. 개발 환경 요구사항

| 항목 | 버전 | 비고 |
|------|------|------|
| Node.js | **20.19.5** | NVM 사용 필수 (`.nvmrc` 자동 인식) |
| npm | **10.8.2** | 패키지 관리 |
| NVM (for Windows) | 1.2.2 이상 | Node 버전 관리 도구 |

---

## ⚙️ 2. 프로젝트 세팅 절차

### ✅ 1️⃣ Node 버전 맞추기
```bash
nvm use
```
- `.nvmrc`에 기록된 Node 버전(`20.19.5`) 자동 적용  
- 만약 설치되어 있지 않다면:
  ```bash
  nvm install 20.19.5
  nvm use
  ```

---

### ✅ 2️⃣ 의존성 설치
```bash
npm ci
```
- `package-lock.json`을 기준으로 **정확히 동일한 버전**의 패키지 설치  
- `node_modules`는 프로젝트에 포함하지 않음 (자동 생성됨)

---

### ✅ 3️⃣ 개발 서버 실행
```bash
npm run dev
```
- 브라우저에서 [http://localhost:5173](http://localhost:5173) 접속  
- 기본 Vite 개발 서버 실행

---

### ✅ 4️⃣ 코드 검사 및 포맷

| 명령어 | 설명 |
|--------|------|
| `npm run lint` | ESLint 검사 (문법 / 타입 / 훅 규칙 확인) |
| `npm run lint:fix` | ESLint 자동 수정 (가능한 항목만 수정) |
| `npm run format` | Prettier 포맷 (세미콜론, 따옴표, 줄바꿈 등 스타일 정렬) |

---

## 🧠 3. package.json 스크립트 명령어

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "lint": "eslint .",
  "lint:fix": "eslint . --fix",
  "format": "prettier --write \"**/*.{ts,tsx,js,json,css,md}\""
}
```

| 명령어 | 설명 | 실행 시점 |
|--------|------|-----------|
| **dev** | Vite 개발 서버 실행 (`localhost:5173`) | 개발 중 |
| **build** | TypeScript 빌드(`tsc -b`) + Vite 빌드 | 배포 전 |
| **preview** | 빌드 결과 로컬 확인 | 배포 전 |
| **lint** | 코드 검사 (ESLint) | 커밋 전 / 점검용 |
| **lint:fix** | ESLint 자동 수정 | 커밋 전 / 리팩토링 시 |
| **format** | Prettier 코드 정렬 | 커밋 전 / 저장 전 |

---

## 🎨 4. 코드 포맷 규칙 (Prettier)

**`.prettierrc`**
```json
{
  "singleQuote": true,
  "semi": true,
  "printWidth": 100,
  "trailingComma": "es5"
}
```

| 항목 | 설명 |
|------|------|
| `singleQuote: true` | 문자열은 `'` 단일 따옴표 사용 |
| `semi: true` | 문장 끝에 세미콜론 자동 추가 |
| `printWidth: 100` | 한 줄 최대 길이 100자로 줄바꿈 |
| `trailingComma: "es5"` | 객체/배열 끝에 쉼표 허용 (ES5 호환) |

**`.prettierignore`**
```
dist
node_modules
```
> 빌드 산출물과 패키지 폴더는 포맷 대상 제외.

---

## 🧩 5. 폴더 구조 요약

```bash
front/
├─ index.html                # 메인 진입 HTML
├─ package.json              # 프로젝트 메타 정보 및 스크립트
├─ tsconfig.json             # TypeScript 설정
├─ vite.config.ts            # Vite 빌드 / 서버 설정
├─ .nvmrc                    # Node 버전 고정 (20.19.5)
├─ .npmrc                    # npm 정책 (engine-strict 등)
├─ .prettierrc               # Prettier 포맷 규칙
├─ .prettierignore           # 포맷 제외 목록
├─ eslint.config.js          # ESLint 플랫 구성
└─ src/                      # 소스 코드 루트
```

---

## ✅ 6. 실행 요약 (팀원이 받은 후 3줄 요약)

```bash
nvm use
npm ci
npm run dev
```

> 위 세 줄이면 Node, npm, 의존성, 실행 환경이 완전히 동일하게 맞춰집니다.  
> (`node_modules`는 자동 생성되므로 복사할 필요 없음)

---

## 🧾 참고

| 파일 | 역할 |
|------|------|
| `.nvmrc` | Node 버전 통일 (`nvm use`로 자동 인식) |
| `.npmrc` | 잘못된 버전의 npm 설치 방지 (선택) |
| `.prettierrc` | 코드 스타일 통일 (따옴표, 세미콜론 등) |
| `.prettierignore` | 포맷 제외 폴더 지정 |
| `eslint.config.js` | 문법 / 타입 / React 훅 규칙 검사 설정 |

---

## 💡 추천 워크플로우

```bash
# 1️⃣ 코드 점검
npm run lint

# 2️⃣ 자동 수정 + 포맷 정리
npm run lint:fix
npm run format

# 3️⃣ 실행
npm run dev
```

---

> 🧩 이 프로젝트는 Node/NVM 기반 버전 격리형 구조입니다.  
> 다른 팀원도 동일하게 `.nvmrc`를 통해 같은 Node 버전으로 개발할 수 있습니다.
