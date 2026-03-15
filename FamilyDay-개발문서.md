# FamilyDay — 개발 문서

> 부모와 초등학생 자녀가 함께 사용하는 귀여운 가족 일정/할일 관리 모바일 앱

**버전**: v1.0
**개발 기간**: 2026년 3월
**타겟 디바이스**: 모바일 퍼스트 (iPhone 14 기준 390×844)

**관련 문서**:
- [기능 스펙](./FamilyDay-기능스펙.md) — 앱 기능, 데이터 모델, 미구현 계획
- [디자인 시스템](./FamilyDay-디자인시스템.md) — 컬러, 타이포, 라운딩, 애니메이션

---

## 기술 스택

| 분류 | 기술 | 버전 |
|------|------|------|
| UI 프레임워크 | React | 18.3.1 |
| 빌드 도구 | Vite | 6.0.0 |
| Vite 플러그인 | @vitejs/plugin-react | 4.3.4 |
| 언어 | JavaScript (ES6+ 모듈) | — |
| 스타일링 | CSS-in-JS (인라인 스타일) | — |
| 패키지 매니저 | pnpm | — |
| 폰트 | Nunito (Google Fonts, 동적 로드) | — |

> TypeScript, CSS 프레임워크(Tailwind 등), 백엔드/DB 없음. 모든 데이터는 React state로 관리 (비영속).

---

## 프로젝트 구조

```
familyday-app/
├── index.html                 # 메인 HTML (뷰포트, 메타, 기본 스타일)
├── package.json               # 의존성 (React 18, Vite)
├── pnpm-lock.yaml             # pnpm 락 파일
├── vite.config.js             # Vite 설정 (port 3000, auto open)
├── README.md                  # 프로젝트 소개
├── FamilyDay-개발문서.md      # 이 문서
├── FamilyDay-기능스펙.md      # 기능 스펙 문서
├── FamilyDay-디자인시스템.md  # 디자인 시스템 문서
├── public/                    # 정적 파일 (현재 비어있음)
└── src/
    ├── main.jsx               # React 엔트리 포인트 (9줄)
    └── FamilyDay.jsx          # 전체 앱 컴포넌트 (단일 파일)
```

### FamilyDay.jsx 내부 구조

모든 컴포넌트가 하나의 파일에 포함된 모놀리식 구조입니다.

```
FamilyDay.jsx
│
├── [상단]     컬러 토큰 (C 객체)
├── [상단]     Google Fonts 동적 로드
├── [상단]     키프레임 애니메이션 (CSS <style> 태그 주입)
├── [상단]     유틸리티 함수 (uid, 날짜 헬퍼 등)
├── [상단]     샘플 데이터 (이벤트, 할일, 타임라인)
│
├── 서브 컴포넌트:
│   ├── StarBurst              # 별 파티클 + 컨페티 애니메이션
│   ├── CuteFace               # 아이 아바타 (재사용 가능)
│   ├── TodoItem               # 할일 아이템 (체크박스, 텍스트, 완료 버튼, 삭제)
│   ├── AddTaskModal           # 할일 추가 바텀시트
│   ├── EventSheet             # 이벤트 상세 바텀시트
│   ├── AddEventModal          # 일정 추가 모달 (날짜/시간/이모지/색상 선택)
│   ├── WeeklyCalendar         # 주간 캘린더 (7일 × 시간 그리드)
│   ├── MonthlyCalendar        # 월간 캘린더 + 다가오는 일정
│   ├── EventSheetWithAdd      # 날짜별 일정 시트 + 추가 버튼
│   └── KidDayTimeline         # 징검다리 타임라인 (11개 노드)
│
├── NavIcons                    # SVG 네비게이션 아이콘 4개
└── FamilyDay (default export)  # 메인 앱 (상태 관리 + 레이아웃)
```

---

## 로컬 실행 방법

### 사전 요구사항
- Node.js 18 이상
- pnpm (또는 npm/yarn)

### 설치 및 실행

```bash
# 의존성 설치
pnpm install

# 개발 서버 실행 (http://localhost:3000 자동 열림)
pnpm dev
```

### 빌드

```bash
# 프로덕션 빌드
pnpm build

# 빌드 결과 미리보기
pnpm preview
```

---

## 기술 메모

- 모든 스타일은 CSS-in-JS (인라인 스타일) 방식, 별도 CSS 파일 없음
- 컬러 토큰은 `C` 객체로 파일 상단에 정의
- 키프레임 애니메이션은 `<style id="fd-kf">` 태그를 head에 동적 주입
- Google Fonts (Nunito)는 동적 `<link>` 태그로 로드
- 이벤트 데이터는 React state로 관리 (월간에서 추가 → 주간에도 즉시 반영)
- 타임라인의 진행중 노드는 테스트용 인덱스 고정 (`TEST_CURRENT_IDX = 5`)
  - 실제 시간 기반으로 전환하려면 해당 상수를 주석 해제하고 `currentMin` 로직 사용
- React Fragment (`<>...</>`) 대신 `<div>` 사용 (일부 트랜스파일러 호환성)
