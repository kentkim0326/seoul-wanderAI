# Seoul Wander 🗺️
> AI-powered Seoul travel planner for foreign tourists  
> 서울시 공공데이터 × GPT-4o × 5개국어 다국어 지원

---

## 🚀 Vercel 배포 가이드 (5단계)

### 1단계 — GitHub에 올리기

```bash
# 프로젝트 폴더에서
git init
git add .
git commit -m "init: Seoul Wander"

# GitHub에서 새 repo 만들고 (예: seoul-wander)
git remote add origin https://github.com/YOUR_NAME/seoul-wander.git
git push -u origin main
```

---

### 2단계 — Vercel 연결

1. [vercel.com](https://vercel.com) 로그인 (GitHub 계정 사용)
2. **Add New Project** → GitHub repo `seoul-wander` 선택
3. Framework: **Vite** 자동 감지됨 ✅
4. **Deploy** 클릭

---

### 3단계 — 환경변수 설정 (중요!)

Vercel Dashboard → 프로젝트 → **Settings → Environment Variables**

| 변수명 | 값 | 비고 |
|---|---|---|
| `OPENAI_API_KEY` | `sk-...` | [platform.openai.com](https://platform.openai.com/api-keys) |
| `VITE_SEOUL_API_KEY` | `발급받은 키` | [data.seoul.go.kr](https://data.seoul.go.kr) 마이페이지 |

> ⚠️ `OPENAI_API_KEY` 는 **절대 `VITE_` 접두사 붙이지 마세요** — 클라이언트에 노출됩니다!

---

### 4단계 — 서울 열린데이터광장 API Key 발급

1. [data.seoul.go.kr](https://data.seoul.go.kr) 회원가입
2. 마이페이지 → **인증키 발급** → 키 복사
3. Vercel 환경변수 `VITE_SEOUL_API_KEY` 에 입력

> 키 없어도 mock 데이터로 동작하므로 배포 먼저 해도 됩니다.

---

### 5단계 — 재배포 (환경변수 적용)

```
Vercel Dashboard → Deployments → Redeploy
```

---

## 🛠️ 로컬 개발

```bash
# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env.local
# .env.local 파일 열어서 API 키 입력

# 개발 서버 시작
npm run dev
# → http://localhost:3000
```

---

## 📁 프로젝트 구조

```
seoul-wander/
├── api/
│   └── generate.js          # Vercel Serverless — GPT-4o 호출
├── src/
│   ├── lib/
│   │   ├── i18n.js          # 5개국어 다국어 (EN/ZH/JP/ES/FR)
│   │   ├── gptCourse.js     # GPT-4o 코스 생성 로직
│   │   └── seoulData.js     # 서울 공공데이터 API 연동
│   ├── pages/
│   │   ├── LandingPage.jsx  # 언어 선택 + 진입
│   │   ├── PlannerPage.jsx  # 테마/일수/음성 입력
│   │   └── ResultPage.jsx   # AI 생성 코스 표시
│   ├── styles/globals.css
│   ├── App.jsx
│   └── main.jsx
├── vercel.json              # Vercel 배포 설정
├── .env.example             # 환경변수 템플릿
└── vite.config.js
```

---

## 🤖 AI 기능 설명

### GPT-4o 코스 생성 (`src/lib/gptCourse.js`)
- 서울 공공데이터 실시간 혼잡도를 프롬프트에 주입
- 사용자 테마·일수·특별요청 반영
- JSON 구조화 응답으로 파싱

### 서울 공공데이터 연동 (`src/lib/seoulData.js`)
| 데이터셋 | 용도 |
|---|---|
| 지하철 혼잡도 | 이동 경로 최적화 |
| 관광지 방문객 현황 | 장소별 혼잡도 표시 |
| 문화행사 정보 | 여행 기간 중 행사 추천 |
| 생활인구 데이터 | 동단위 유동인구 분석 |

### 다국어 지원 (`src/lib/i18n.js`)
- `i18next` 기반 5개국어 완전 지원
- 브라우저 언어 자동 감지
- 음성 입력(STT) 언어도 자동 매핑

---

## 📝 심사 제출용 링크

배포 완료 후 Vercel이 자동 발급하는 URL:
```
https://seoul-wander-[hash].vercel.app
```
→ 이 URL을 상세기획서 **결과물(링크)** 란에 제출하세요.
