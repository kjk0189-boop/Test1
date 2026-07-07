# Punch — 출퇴근 근태 관리 (웹 서버 + DB 버전)

지금까지 프로토타입(브라우저 임시저장)으로 테스트하던 것을, 실제 서버(Next.js) + 실제 데이터베이스(Postgres)로 옮긴 버전이에요.

## 이번 버전에 포함된 기능

- 로그인(휴대폰번호 + 비밀번호), 최초 로그인 시 비밀번호 변경 강제
- 비밀번호 초기화 (매니저: 본인 지점 크루원 / 관리자: 전체 매니저)
- 크루원: 출/퇴근(QR 토큰 검증), 내 근무 기록(월별 조회)
- 매니저: 출근 현황, 근태 수정(+수정 이력 로그), 크루원 등록/수정/삭제, 급여 관리(연장·야간·주휴수당 자동 계산)
- 관리자: 통합 대시보드, 지점 운영(지점 선택 후 매니저 화면 대행), 지점 관리(신규 지점 추가), 매니저 관리(등록/수정/삭제), 전 지점 급여, 근태 수정 이력(전 지점)
- 계정 설정(비밀번호 변경) 공통 기능

## 아직 옮기지 않은 기능 (다음 단계)

근로계약서(서명), 매장 QR 이미지 출력(지금은 매장 코드 값만 서버에 전송해서 검증하는 방식), 급여명세서 발급·저장 이력(지금은 매번 새로 계산해서 보여주기만 하고 "발급" 기록은 남기지 않아요) — 이 부분들은 다음 단계로 미뤄뒀어요.

## 기술 스택

- **Next.js 16** (App Router, TypeScript) — 화면과 서버 API를 한 프로젝트에서 처리
- **Drizzle ORM + Postgres** — 데이터베이스
- **jose (JWT) 쿠키 세션** — 로그인 상태 유지
- **bcryptjs** — 비밀번호 해시 저장 (평문 저장 아님)

---

## 배포 순서 (처음이라면 이 순서 그대로 따라 하시면 돼요)

### 1. GitHub에 코드 올리기

1. https://github.com 가입 (계정 없다고 하셨으니 여기서부터)
2. 우측 상단 `+` → `New repository` → 이름 예: `punch-web` → `Create repository`
3. 이 프로젝트 폴더에서 터미널로:
   ```bash
   git init
   git add .
   git commit -m "init"
   git branch -M main
   git remote add origin <방금 만든 저장소 URL>
   git push -u origin main
   ```
   (터미널 사용이 어려우시면 GitHub Desktop 앱을 쓰셔도 돼요.)

### 2. Neon에서 무료 Postgres DB 만들기

1. https://neon.tech 가입 (GitHub 계정으로 바로 가입 가능)
2. `Create a project` → 이름 아무거나 → 리전은 가까운 곳(도쿄 등) 선택
3. 생성되면 `Connection string`이 보여요. `postgres://...` 형태의 문자열을 복사해두세요. (이게 `DATABASE_URL`이에요)

### 3. Vercel에 배포하기

1. https://vercel.com 가입 → **GitHub 계정으로 가입/로그인** (그러면 GitHub 저장소 연결이 자동으로 돼요)
2. `Add New` → `Project` → 방금 올린 `punch-web` 저장소 선택 → `Import`
3. `Environment Variables`에 아래 두 개를 추가:
   - `DATABASE_URL` = 2번에서 복사한 Neon 연결 문자열
   - `SESSION_SECRET` = 아무 긴 임의 문자열 (터미널에서 `openssl rand -base64 32` 실행하면 하나 나와요)
4. `Deploy` 클릭 → 몇 분 기다리면 `https://프로젝트이름.vercel.app` 주소가 생겨요

### 4. 데이터베이스 테이블 만들기 + 초기 계정 넣기

로컬 컴퓨터(내 노트북)에서 진행해요.

```bash
# 1) 이 프로젝트 폴더에서
npm install

# 2) .env 파일 만들기 (.env.example 복사)
cp .env.example .env
# .env 파일을 열어서 DATABASE_URL, SESSION_SECRET을 Neon/생성한 값으로 채워넣기

# 3) 테이블 생성 (Neon DB에 실제로 테이블을 만듦)
npm run db:push

# 4) 초기 계정(김대표, 매니저 2명, 크루원 3명) 넣기 — 전부 초기 비밀번호 0000
npm run db:seed
```

이 작업은 Vercel에 올라간 앱과 **같은 DB**를 보고 있으니, 한 번만 해두면 배포된 사이트에서도 로그인이 바로 돼요.

### 5. 접속 테스트

`https://프로젝트이름.vercel.app/login` 으로 들어가서 다음 계정으로 로그인해보세요.

| 이름 | 휴대폰번호 | 비밀번호 |
|---|---|---|
| 김대표 (관리자) | 01000000000 | 0000 |
| 박매니저 (강남점) | 01010001000 | 0000 |
| 최크루 (강남점) | 01011112222 | 0000 |

---

## 로컬에서 직접 실행해보고 싶을 때

```bash
npm install
cp .env.example .env   # DATABASE_URL, SESSION_SECRET 채우기
npm run db:push
npm run db:seed
npm run dev
# http://localhost:3000
```

## 알아두면 좋은 점 (현재 한계)

- 매니저가 다른 지점으로 재배정되면, 그 매니저는 **재로그인**을 해야 권한이 새로 반영돼요 (로그인 세션에 소속 지점 정보가 담겨있기 때문).
- QR 스캔은 아직 "카메라로 실제 QR을 찍는" 방식이 아니라, 기존 프로토타입처럼 매장 코드 값을 그대로 서버에 보내 검증하는 방식이에요. 실제 카메라 스캔은 추후 추가 가능해요.
- 세션 비밀키(`SESSION_SECRET`)는 반드시 추측 불가능한 값으로 설정해주세요. 이게 유출되면 누구나 로그인 토큰을 위조할 수 있어요.
