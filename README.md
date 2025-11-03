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
| **터미널 권장** | PowerShell / CMD / VSCode 터미널 | 아래의 `npm run node`로 모든 터미널 호환 |

> 💡 **왜 `npm run node`를 쓰나요?**  
> Windows 환경에서 `.nvmrc`를 읽어 `nvm use`를 실행할 때, **줄 끝 공백/개행(LF/CRLF) 이슈**로 버전 인식 오류가 발생할 수 있습니다.  
> 이 프로젝트는 PowerShell에서 `.Trim()`으로 공백을 제거하도록 하여 **PowerShell, CMD, VSCode 터미널** 어디서든 안정적으로 동작하도록 통일했습니다.

---

## ⚙️ 2. 프로젝트 세팅 절차

### ✅ 0️⃣ Node 버전 맞추기 — **모든 터미널 호환 (권장)**
```bash
npm run node
```
- 내부적으로 PowerShell을 호출해 `.nvmrc`의 버전을 읽고 **앞/뒤 공백을 제거**한 뒤 `nvm use`를 수행합니다.
- `.nvmrc` 내용이 `20.19.5` 한 줄이어도, 줄 끝 공백이나 CRLF가 있어도 안전하게 처리됩니다.

> `package.json`의 스크립트:
```json
{
  "scripts": {
    "node": "powershell -NoProfile -ExecutionPolicy Bypass -Command \"$v = (Get-Content .nvmrc).Trim(); nvm use $v\""
  }
}
```

### ✅ 1️⃣ (대안) 기본 NVM 명령
```bash
nvm use
# 설치 안 되어 있으면
nvm install 20.19.5
nvm use
```
> 위 방식은 터미널/개행 설정에 따라 간헐적으로 실패할 수 있으므로, 팀 공통으로는 **`npm run node`** 사용을 권장합니다.

---

### ✅ 2️⃣ 의존성 설치
```bash
npm ci
```
- `package-lock.json`을 기준으로 **정확히 동일한 버전**의 패키지 설치  
- `node_modules`는 프로젝트에 포함하지 않음 (자동 생성)

---

### ✅ 3️⃣ 개발 서버 실행
```bash
npm run dev
```
- 브라우저에서 http://localhost:5173 접속  
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
  "node": "powershell -NoProfile -ExecutionPolicy Bypass -Command \"$v = (Get-Content .nvmrc).Trim(); nvm use $v\"",
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
| **node** | `.nvmrc` 버전 자동 적용(공백 자동 제거) | 모든 터미널에서 공통 사용 |
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

**`.prettierignore`**
```
dist
node_modules
```

---

## 🧩 5. 폴더 구조 요약
(생략 — 기존 내용 유지)

---

## ✅ 6. 실행 요약 (팀원이 받은 후 3줄 요약)

```bash
npm run node    # .nvmrc 버전 자동 적용 (공백 자동 제거, 모든 터미널 호환)
npm ci
npm run dev
```

---

## 🧾 참고 / 환경별 차이 안내

- **PowerShell / CMD / VSCode 터미널**: `npm run node`가 내부적으로 PowerShell을 호출해 `.Trim()`을 적용하므로 **동일하게 동작**합니다.  
- **Git Bash / MSYS2**: 직접 `nvm use`를 호출하면 개행/경로 차이로 실패할 수 있습니다. 이 경우에도 **`npm run node`**를 먼저 실행하면 안전합니다.  
- **WSL(리눅스 NVM)**: Windows용 nvm과는 **다른 구현**입니다. WSL 내부에서는 `nvm use`(linux nvm)를 사용하세요. 윈도우 쪽 프로젝트 루트에서 작업할 때는 **`npm run node`**를 사용하세요.  
- **개행(LF/CRLF) 혼재**: `.nvmrc` 끝 공백/개행에 민감합니다. 본 프로젝트는 `.Trim()`으로 대응하여 문제를 예방합니다.
