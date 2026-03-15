# FamilyDay — 가족 스케줄 & 할일 관리 앱

> 부모와 초등학생 자녀가 함께 사용하는 귀여운 가족 일정/할일 관리 모바일 앱

**버전**: v1.0  
**개발 기간**: 2026년 3월  
**기술 스택**: React 18 + Vite + CSS-in-JS (인라인 스타일)  
**타겟 디바이스**: 모바일 퍼스트 (iPhone 14 기준 390×844)

---

## 프로젝트 개요

FamilyDay는 부모(특히 엄마)와 초등학생 자녀(6~12세)가 함께 사용하는 가족 스케줄 및 할일 관리 앱입니다. 아이들이 좋아할 수 있도록 귀여운 캐릭터, 징검다리 타임라인, 별 보상 시스템 등 게이미피케이션 요소를 적극 활용했습니다.

### 주요 콘셉트

- Duolingo + Google Tasks를 결합한 느낌
- 둥글고 부드러운 파스텔 톤 UI
- 아이 캐릭터가 타임라인 위에 서 있는 징검다리 디자인
- 할일 완료 시 별 파티클 애니메이션 → 보상 시스템 연동
- 모든 UI 텍스트는 한국어

---

## 구현 완료된 화면

### 1. 홈 / 일간 할일 (Home / Daily Todo)

**경로**: 하단 네비게이션 `홈` → 상단 탭 `일간`

#### 기능
- 인사 헤더: "안녕, Luna네 가족! 👋" + 오늘 날짜 (한국어 포맷)
- 귀여운 아이 얼굴 아바타 (둥근 노란 얼굴, 점 눈, 미소, 볼터치)
- 상단 탭 전환: 일간 / 주간 / 월간 (pill 스타일)
- 오늘의 일정 카드: 최대 3개 이벤트, 컬러 도트 표시
- 할일 보드 (두 개의 섹션)
  - 👩 엄마 섹션 (핑크 태그): 체크박스 클릭으로 토글
  - 🧒 Luna 섹션 (보라 태그): "완료 ✓" 버튼으로 완료 처리
- 할일 완료 시: 체크 애니메이션 + 취소선 + ⭐ 별 파티클 폭발
- 플로팅 "+ 할일 추가" 버튼 → 바텀시트 모달
  - 엄마/Luna 선택 토글
  - 텍스트 입력
  - Enter 또는 버튼으로 추가
- 이번 주 별 모으기 프로그레스 바 (23/30)

#### 컴포넌트
- `TodoItem`: 개별 할일 아이템 (체크박스, 텍스트, 완료 버튼, 삭제)
- `StarBurst`: 별 파티클 + 컨페티 애니메이션
- `AddTaskModal`: 할일 추가 바텀시트
- `CuteFace`: 아이 아바타 (재사용 가능)

---

### 2. 주간 캘린더 (Weekly Calendar)

**경로**: 상단 탭 `주간`

#### 기능
- 주간 날짜 헤더: 월요일~일요일, 오늘 날짜 보라색 원 하이라이트
- `<` `>` 버튼 또는 좌우 터치 스와이프로 주 이동
- 08:00~20:00 시간 그리드 (1시간 단위, 44px 높이)
- 색상 코딩된 이벤트 블록 (시작~종료 시간 만큼 높이 계산)
- 이벤트 탭 → 바텀시트로 상세 정보 표시
- 주 전환 시 좌/우 슬라이드 애니메이션

#### 컴포넌트
- `WeeklyCalendar`: 주간 뷰 전체 (props로 events 받음)
- `EventSheet`: 이벤트 상세 바텀시트

---

### 3. 월간 캘린더 (Monthly Calendar)

**경로**: 상단 탭 `월간` 또는 하단 네비게이션 `캘린더`

#### 기능
- 년/월 헤더: "2026년 3월" + `<` `>` 월 이동
- 전체 달력 그리드: 일/토 요일 색상 구분 (빨강/파랑)
- 일정 있는 날에 컬러 도트 표시 (최대 3개)
- 오늘 날짜 보라색 원 하이라이트
- 날짜 탭 → 바텀시트로 해당 날 일정 표시
  - 일정이 없으면 "일정이 없어요" + "📅 새 일정 만들기" 버튼
  - 일정이 있으면 목록 + "일정 추가" 버튼
- 하단 "📌 다가오는 일정" 리스트 + "+ 추가" 버튼
- **일정 추가 모달** (AddEventModal)
  - 일정 이름 텍스트 입력
  - 날짜 date picker (날짜 클릭 시 자동 입력)
  - 시작/종료 시간 time picker
  - 16개 이모지 아이콘 선택
  - 8개 색상 팔레트 선택
  - 실시간 미리보기 카드
- 추가된 일정은 달력 도트 + 다가오는 일정 + 주간 캘린더에 즉시 반영

#### 컴포넌트
- `MonthlyCalendar`: 월간 뷰 전체 (props: events, onAddEvent)
- `AddEventModal`: 일정 추가 바텀시트
- `EventSheetWithAdd`: 날짜별 일정 시트 + 추가 버튼

---

### 4. 타임라인 — Luna의 하루 (Kid's Day Timeline)

**경로**: 하단 네비게이션 `타임라인`

#### 기능
- 헤더 카드: 아바타 + "Luna의 하루 ✨" + 완료 현황 (5/11 완료)
- **징검다리 타임라인**: 노드가 좌 ↔ 우 번갈아 배치
- SVG 베지어 곡선으로 노드 간 부드러운 연결선
- 11개 일정 노드: 기상(07:00) → 아침식사 → 등교 준비 → 학교 → 점심 → 숙제 → 피아노 → 놀이시간 → 저녁식사 → 자유시간 → 취침(21:00)
- 시간별 3가지 상태:
  - ✅ **완료**: 민트 그라데이션 원 + 체크마크 + 👣 발자국 + 연결선 실선 민트색
  - 🟣 **진행중**: 보라 글로우 원 + 이모지 + 이중 글로우 링 애니메이션
    - **아이 캐릭터**: 둥근 노란 얼굴 + ⭐ 머리핀 + 보라색 옷 + 분홍 신발
    - 말풍선 "지금! 📝" + 둥둥 떠다니는 float 애니메이션
    - 라벨 카드에 "진행중" 뱃지 + 60% 프로그레스 바
  - ⚪ **미래**: 연한 회색 원 + 흐릿한 이모지 + 점선 연결
- 테스트 모드: `TEST_CURRENT_IDX = 5` (숙제)로 고정
- 진행중 노드로 자동 스크롤

#### 컴포넌트
- `KidDayTimeline`: 타임라인 전체 (useMemo로 노드 상태 계산)

---

### 5. 가족 (Family) — Placeholder

**경로**: 하단 네비게이션 `가족`

- "Luna네 가족" 제목 + 👨‍👩‍👧 이모지
- "가족 관리 기능이 곧 추가돼요! ✨" 메시지

---

## 내비게이션 구조

```
하단 GNB (항상 표시)
├── 🏠 홈
│   ├── 일간 (할일 보드 + 오늘의 일정 + 별 프로그레스)
│   ├── 주간 (주간 캘린더 + 시간 그리드)
│   └── 월간 (월간 캘린더 + 다가오는 일정 + 일정 추가)
├── 📅 캘린더 → 월간 캘린더로 바로 이동
├── 📋 타임라인 → Luna의 하루 징검다리 타임라인
└── 👥 가족 → Placeholder
```

---

## 디자인 시스템

### 컬러 팔레트

| 역할 | 색상 | HEX |
|------|------|-----|
| Primary (보라) | 🟣 | `#6C63FF` |
| Primary Light | 🟣 | `#8B83FF` |
| Secondary (코랄 핑크) | 🔴 | `#FF6584` |
| Accent (민트 그린) | 🟢 | `#43D4A0` |
| Gold (별/보상) | 🟡 | `#FFD700` |
| Background | ⚪ | `#F4F5FF` |
| Text Dark | ⚫ | `#2D2B55` |
| Text Mid | 🔘 | `#6E6B99` |
| Text Light | ⚪ | `#A9A6C8` |
| Border | ⚪ | `#EEEDFC` |
| Mom Tag | 🔴 | `#FF6584` |
| Kid Tag | 🟣 | `#6C63FF` |

### 타이포그래피

- **폰트**: Nunito (Google Fonts)
- **굵기**: 400, 600, 700, 800, 900
- **헤딩**: 18-22px, fontWeight 900
- **본문**: 14-15px, fontWeight 600
- **캡션**: 11-13px, fontWeight 700

### 라운딩 & 그림자

- 카드: `borderRadius: 20px`, `boxShadow: 0 4px 20px rgba(108,99,255,.08)`
- 버튼/뱃지: `borderRadius: 999px` (pill)
- 모달: `borderRadius: 28px 28px 0 0`

### 애니메이션

| 이름 | 용도 |
|------|------|
| `starFly` | 별 완료 시 날아가는 효과 |
| `confetti` | 컨페티 파티클 |
| `pop` | 스케일 바운스 |
| `slideUp` | 카드/모달 등장 |
| `slideLeft/Right` | 캘린더 주/월 전환 |
| `fadeIn` | 오버레이 등장 |
| `checkPop` | 체크마크 등장 |
| `strikethrough` | 취소선 효과 |
| `pulseGlow` | 플로팅 버튼 글로우 |
| `glowRingCurrent` | 진행중 노드 글로우 링 |
| `float` | 캐릭터 떠다니기 |
| `shimmer` | 프로그레스 바 빛남 |

---

## 데이터 모델

### Event (일정)
```javascript
{
  id: string,
  title: string,        // "피아노 레슨"
  date: string,         // "2026-03-12" (YYYY-MM-DD)
  startHour: number,
  startMin: number,
  endHour: number,
  endMin: number,
  color: string,        // "#6C63FF"
  emoji: string,        // "🎹"
}
```

### TodoItem (할일)
```javascript
{
  id: string,
  text: string,         // "책 읽기 30분"
  owner: "mom" | "kid",
  isDone: boolean,
  starReward: number,   // 기본 1
}
```

### Timeline Item (타임라인 일정)
```javascript
{
  id: string,
  time: string,         // "07:00"
  hour: number,
  min: number,
  label: string,        // "기상"
  emoji: string,        // "🌅"
}
```

---

## 프로젝트 구조

```
familyday-app/
├── index.html              # 메인 HTML (뷰포트, 메타, 폰트)
├── package.json            # 의존성 (React 18, Vite)
├── vite.config.js          # Vite 설정 (port 3000, auto open)
├── README.md               # 이 문서
└── src/
    ├── main.jsx            # React 엔트리 포인트
    └── FamilyDay.jsx       # 전체 앱 컴포넌트 (단일 파일)
```

### 컴포넌트 구조 (FamilyDay.jsx 내부)

```
FamilyDay (메인 앱)
├── CuteFace              # 아이 아바타 (재사용)
├── StarBurst             # 별 파티클 애니메이션
├── TodoItem              # 할일 아이템
├── AddTaskModal          # 할일 추가 모달
├── EventSheet            # 이벤트 상세 바텀시트
├── EventSheetWithAdd     # 이벤트 시트 + 추가 버튼
├── AddEventModal         # 일정 추가 모달
├── WeeklyCalendar        # 주간 캘린더 뷰
├── MonthlyCalendar       # 월간 캘린더 뷰
└── KidDayTimeline        # 징검다리 타임라인
```

---

## 로컬 실행 방법

### 사전 요구사항
- Node.js 18 이상
- npm 또는 yarn

### 설치 및 실행

```bash
# 1. 프로젝트 폴더로 이동
cd familyday-app

# 2. 의존성 설치
npm install

# 3. 개발 서버 실행
npm run dev

# 4. 브라우저에서 자동으로 열림 → http://localhost:3000
```

### 빌드

```bash
# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

---

## 향후 개발 계획 (미구현)

### ⭐ Star Rewards 화면
- 아이 아바타 + 총 별 개수 + 레벨 뱃지 (예: "Lv.3 탐험가")
- 주간 프로그레스 바 (23/30 별)
- 오늘의 할일 목록 (완료된 것 금색 하이라이트 + ⭐ +1)
- 별 항아리 시각화 (유리 병에 금색 별이 채워지는 효과)
- 보상 패널 (30⭐ = 영화의 밤 🎬 등, "GET!" 버튼)
- 연속 달성 배너 ("🔥 5일 연속!")

### 👨‍👩‍👧 가족 관리 화면
- 가족 멤버 프로필 (아바타 선택, 이름 편집)
- 역할 기반 권한 (부모: 전체 관리, 아이: 자기 할일만)

### 기타
- 데이터 영속화 (localStorage 또는 Supabase 연동)
- 푸시 알림 (일정 리마인더)
- 모션 설정 (reduce motion 지원)
- 다크 모드
- 반복 일정 (매주, 매월)

---

## 기술 메모

- 모든 스타일은 CSS-in-JS (인라인 스타일) 방식, 별도 CSS 파일 없음
- 키프레임 애니메이션은 동적으로 `<style>` 태그를 head에 주입
- Google Fonts (Nunito)는 동적 `<link>` 태그로 로드
- 이벤트 데이터는 React state로 관리 (월간 추가 → 주간에도 반영)
- 타임라인의 진행중 노드는 테스트용으로 인덱스 고정 (`TEST_CURRENT_IDX = 5`)
  - 실제 시간 기반으로 전환하려면 해당 상수를 주석 해제하고 `currentMin` 로직 사용
- `return` 뒤에 JSX 태그가 올 때 반드시 공백 필요 (`return <div>`, ~~`return<div>`~~ )
- React Fragment (`<>...</>`) 대신 `<div>` 사용 (일부 트랜스파일러 호환성)
