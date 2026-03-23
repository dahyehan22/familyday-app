# FamilyDay — 개발 계획

> 최종 업데이트: 2026-03-23

---

## 현재 상태 요약

### 완료된 변경사항 (v0.3)

| 항목 | 변경 내용 |
|------|----------|
| 타임라인 | 징검다리(좌우 교차) → 세로형 중앙 스파인 타임라인으로 재설계 |
| 타임라인 캐릭터 | 손그림 캐릭터(머리/몸통/팔/다리) → `CuteFace` 프로필 아바타로 교체 |
| 할일 수정 | 할 일 보드에서 연필 아이콘 또는 텍스트 클릭으로 수정 모달 진입 |
| 쿠폰 사용 (아이용) | 홈 "별 모으기" 카드 클릭 → 쿠폰 사용 페이지 (별 차감, 사용 확인 팝업, 사용 완료 전환) |
| 쿠폰 관리 (부모용) | 가족 탭 마이페이지 → 쿠폰 관리 페이지 (추가/삭제, 이모지·별·이름·설명 입력) |
| 쿠폰 데이터 | 하드코딩 상수 → `useState`로 동적 관리 (부모 추가/삭제 → 아이 페이지 즉시 반영) |
| 아이 이름 동적 적용 | 하드코딩 "Luna" → `user.members`에서 `role:"아이"` 이름 추출, 전체 UI 반영 |
| 텍스트 수정 | "할일 보드" → "할 일 보드", "이번 주 별 모으기" → "별 모으기", "쿠폰 교환" → "쿠폰 사용" 통일 |
| 날짜 표기 | `weekday:"short"` → `weekday:"long"` (2026년 3월 15일 일요일) |
| 별 모으기 | 최대값(30) 제거 → 모은 별 개수만 표시, 쿠폰 사용 시 별 차감 반영 |
| 할 일 상태 관리 | 일주일 단위 관리 (월요일 리셋), 미완료 할 일 다음날 자동 이월, 완료 할 일은 당일만 표시 |
| 할 일 매주 반복 | 추가 모달에 "매주 반복" 토글, 새 주 시작 시 반복 할 일 자동 재생성 |

### 이전 변경사항 (v0.2)

| 항목 | 변경 내용 |
|------|----------|
| 홈 | 탭 제거 → 일간 스케줄 + 할일 보드 + 리워드 고정 표시 |
| 캘린더 | 홈에서 분리 → 독립 페이지 (일간/주간/월간 탭 전환) |
| 일정 반복 | 매일/매주/매월 반복 + 매주 요일별 시간 개별 설정 |
| 가족 탭 | placeholder → 인증 + 마이페이지 구현 (Magic Link 목업) |
| 일정 추가 UI | 바텀시트 모달로 통일 (AddEventPage 인라인 폼 제거) |
| 구성원 추가 | prompt() → 바텀시트 모달 (이름/역할/이모지 선택) |

### 현재 GNB 구조

```
하단 GNB (4탭)
├── 🏠 홈 — 오늘의 일정 + 할 일 보드 + 별 리워드 → 쿠폰 사용
├── 📅 캘린더 — 일간 / 주간 / 월간 탭 전환, 일정 추가/반복
├── 📋 타임라인 — {아이이름}의 하루 세로형 타임라인
└── 👥 가족 — 비로그인: Magic Link 인증 / 로그인: 마이페이지 + 쿠폰 관리
```

---

## Phase 1: Supabase 연동 (인증 + 데이터)

### 1-1. Supabase 프로젝트 설정
- [x] Supabase 프로젝트 생성
- [x] `@supabase/supabase-js` 패키지 설치
- [x] 환경변수 설정 (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- [x] Supabase 클라이언트 초기화 (`src/supabaseClient.js`)
- [x] GitHub Actions에 환경변수 주입 (deploy.yml)

### 1-2. 이메일+비밀번호 인증 연동 (Magic Link → 변경)
- [x] Magic Link(OTP) → 이메일+비밀번호 방식으로 전환
- [x] Supabase Dashboard에서 Email Provider 활성화
- [x] 회원가입: `supabase.auth.signUp({ email, password })`
- [x] 로그인: `supabase.auth.signInWithPassword({ email, password })`
- [x] 로그인/회원가입 탭 전환 UI
- [x] 회원가입 후 이메일 확인 안내 화면 (Confirm email ON 시)
- [x] 중복 이메일 / 잘못된 비밀번호 / Rate limit 에러 처리
- [x] `onAuthStateChange` 리스너로 세션 감지 → 자동 로그인 유지
- [x] 로그아웃 시 `supabase.auth.signOut()` 호출
- [ ] **[테스트 예정 - 2026-03-24]** 신규 회원가입 → 로그인 플로우 검증
- [ ] **[테스트 예정 - 2026-03-24]** 초대 코드로 가족 합류 → 데이터 공유 검증

### 1-3. DB 테이블 설계

```sql
-- 사용자 프로필 (auth.users와 연동)
profiles
  id          uuid (auth.users.id FK)
  nickname    text
  photo_url   text
  created_at  timestamptz

-- 가족 그룹
families
  id          uuid
  name        text
  created_at  timestamptz

-- 가족 구성원
family_members
  id          uuid
  family_id   uuid (families FK)
  user_id     uuid (profiles FK, nullable)
  name        text
  role        text ("부모" | "아이")
  emoji       text
  created_at  timestamptz

-- 일정
events
  id          uuid
  family_id   uuid (families FK)
  title       text
  date        date
  start_time  time
  end_time    time
  color       text
  emoji       text
  repeat_type text ("none" | "daily" | "weekly" | "monthly")
  repeat_days jsonb (매주 반복 시 요일별 시간, 예: [{"day":1,"start":"14:00","end":"15:00"}])
  repeat_weeks integer (매주 반복 시 주 수)
  created_by  uuid (profiles FK)
  created_at  timestamptz

-- 할일
todos
  id          uuid
  family_id   uuid (families FK)
  text        text
  owner       text ("mom" | "kid")
  is_done     boolean
  star_reward integer
  date        date
  created_at  timestamptz

-- 쿠폰 정의 (부모가 관리)
coupons
  id          uuid
  family_id   uuid (families FK)
  emoji       text
  star_cost   integer
  title       text
  description text (nullable)
  created_by  uuid (profiles FK)
  created_at  timestamptz

-- 쿠폰 사용 이력
coupon_usage
  id          uuid
  coupon_id   uuid (coupons FK)
  used_by     uuid (family_members FK)
  stars_spent integer
  used_at     timestamptz

-- 알림 (쿠폰 사용 시 부모 알림 등)
notifications
  id          uuid
  family_id   uuid (families FK)
  target_user uuid (profiles FK)
  type        text ("coupon_used" | "todo_done" | ...)
  title       text
  body        text
  is_read     boolean
  created_at  timestamptz
```

- [x] Supabase에 테이블 생성 (todos, events, coupons, family_settings)
- [x] RLS(Row Level Security) 정책 설정 (가족 단위 접근 제어)
  - [x] todos/events/coupons/family_settings/families/family_members/family_invites 전체 적용
  - [x] `get_my_family_id()` 헬퍼 함수 생성
  - [x] todos/events/coupons/family_settings 테이블에 family_id 컬럼 추가
  - [x] 기존 데이터 family_id 마이그레이션 완료
- [x] 기존 useState 데이터를 Supabase CRUD로 교체
  - [x] events: 조회/추가/삭제
  - [x] todos: 조회/추가/완료 토글/삭제/수정
  - [ ] profiles: 조회/수정
  - [ ] family_members: 조회/추가/삭제
  - [x] coupons: 조회/추가/삭제
  - [ ] coupon_usage: 사용 기록/조회

### 1-4. 가족 초대 기능

#### 구성원 유형
| 유형 | 설명 |
|------|------|
| **연결된 구성원** | 초대 코드로 합류한 실제 사용자 (자기 계정으로 로그인) |
| **프로필 구성원** | 계정 없이 이름만 등록 (어린 자녀 등, 부모가 대신 관리) |

#### 초대 코드 플로우
```
1. 부모(관리자)가 "구성원 초대" 버튼 클릭
2. 6자리 초대 코드 자동 생성 (예: FD-A3K9)
   └── 유효기간: 24시간, 1회 사용
3. 카카오톡/문자로 코드 공유
4. 상대방이 가족 탭 → "초대 코드 입력" → 가족에 합류
```

#### DB 테이블
```sql
-- 초대 코드
family_invites
  id          uuid
  family_id   uuid (families FK)
  code        text (unique, 예: "FD-A3K9")
  invited_by  uuid (profiles FK)
  used_by     uuid (nullable, 사용 시 기록)
  expires_at  timestamptz (생성 후 24시간)
  created_at  timestamptz
```

#### 구현 항목
- [ ] 가족 그룹 생성 (첫 가입 시 자동)
- [ ] 초대 코드 생성 API (6자리, 24시간 유효, 1회 사용)
- [ ] 초대 코드 입력 UI + 가족 합류 처리
- [ ] 프로필 구성원 추가 (계정 없는 자녀 등)
- [ ] 가족 구성원 간 데이터 공유
- [ ] 구성원 역할 권한 (부모: 전체 관리, 아이: 자기 할일만)

---

## Phase 2: 기능 고도화

### 2-1. 홈 개선
- [ ] 오늘의 일정을 Supabase events에서 실시간 조회
- [ ] 할일 완료 시 서버에 즉시 반영
- [ ] 가족 구성원별 할일 필터링

### 2-2. 캘린더 개선
- [ ] 일간 뷰: 시간대별 일정 표시 (주간 캘린더와 유사한 그리드)
- [ ] 일정 수정/삭제 기능
- [ ] 반복 일정 개별/전체 수정/삭제
- [ ] 가족 구성원별 일정 필터
- [x] 매주 요일별 시간 개별 설정 반복 기능
- [x] 일정 추가 바텀시트 모달 (animation containing block 이슈 해결)

### 2-3. 쿠폰/보상 고도화
- [x] 쿠폰 사용 페이지 (아이용)
- [x] 쿠폰 관리 페이지 (부모용, 추가/삭제)
- [ ] 쿠폰 사용 시 부모에게 푸시 알림/인앱 알림
- [ ] 쿠폰 사용 이력 조회 (부모용)
- [ ] 쿠폰 수정 기능
- [ ] 별 레벨 시스템 (총 누적 별 기반 레벨 뱃지)
- [ ] 연속 달성 배너 ("🔥 5일 연속!")

### 2-4. 타임라인 개선
- [x] 세로형 중앙 스파인 타임라인 재설계
- [x] 프로필 아바타(`CuteFace`) 적용
- [ ] Supabase events 기반으로 동적 타임라인 생성
- [ ] 할일 완료 상태 연동

---

## Phase 3: UX/UI 고도화

### 3-1. 레이아웃 & 네비게이션 개선
- [ ] 상단 영역 고정 (스크롤 시에도 상단 헤더 픽스)
- [ ] 스크롤 다운 시 하단 GNB 숨김 (스크롤 업 시 다시 표시)

### 3-2. 일정 추가 UX 개선
- [ ] 일정 추가 버튼을 달력 옆이 아닌 할일 추가 버튼처럼 독립 버튼으로 변경

### 3-3. 타임라인 개선
- [ ] 타임라인 색상 3가지로 제한 (과도한 색상 사용 정리)
- [ ] 현재 시간 기준으로 타임라인 자동 스크롤 (진입 시 현재 시간대 위치로 이동)
- [ ] 타임라인 진입 시 아이가 있는 영역이 먼저 보이도록 포커스

### 3-4. 기타
- [ ] 프로필 사진 Supabase Storage 업로드
- [ ] 푸시 알림 (일정 리마인더)
- [ ] 다크 모드
- [ ] reduce motion 지원
- [ ] 오프라인 지원 (optimistic update + 동기화)
- [ ] 앱 온보딩 (첫 사용 가이드)

---

## 기술 스택 정리

| 영역 | 현재 | 목표 |
|------|------|------|
| 프론트엔드 | React 18 + Vite | 유지 |
| 인증 | localStorage 목업 | Supabase Auth (Magic Link) |
| DB | useState (메모리) | Supabase PostgreSQL |
| 스토리지 | FileReader (로컬) | Supabase Storage |
| 호스팅 | 미정 | Vercel 또는 Netlify |

---

## 우선순위

```
1순위: Supabase 인증 연동 (Phase 1-1, 1-2)
2순위: DB 테이블 생성 + 데이터 연동 (Phase 1-3)
3순위: 가족 초대 기능 (Phase 1-4)
4순위: 기능 고도화 (Phase 2)
5순위: UX/UI 고도화 (Phase 3)
```
