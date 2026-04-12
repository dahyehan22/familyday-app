# FamilyDay 리팩토링 명세 (Planner Output)
# 버전: 1.0 | 작성일: 2026-04-12

## 제약 조건 (CLAUDE.md 기반, 절대 위반 불가)
- 모든 컴포넌트는 `src/FamilyDay.jsx` 단일 파일 유지
- CSS-in-JS 인라인 스타일만 사용 (별도 CSS 파일 금지)
- 색상은 반드시 `C` 토큰 사용
- 새 외부 라이브러리 도입 금지
- 모든 UI 텍스트 한국어 유지

## 허용 범위
- `src/supabaseClient.js`에 DB 쿼리 함수 추가 가능
- `src/FamilyDay.jsx` 내 커스텀 훅(`use*`) 추가 가능
- 공용 컴포넌트(`BottomSheet`, `ConfirmModal`) 동일 파일 내 추가 가능
- 파일 상단 공용 스타일 상수 추가 가능

---

## 스프린트 계획 (의존성 순서)

### Sprint 1: 공용 BottomSheet 컴포넌트 추출
**목표**: 8곳에서 중복되는 바텀시트 래퍼를 단일 컴포넌트로 추출
**추출 위치**: `CuteFace` 바로 아래 삽입
**적용 대상**: AddTaskModal, EditTaskModal, EventSheet, EventSheetWithAdd, AddEventModal, EditCouponModal, AddCouponModal
**성공 기준**:
- `pnpm build` 통과
- 모달 열기/닫기 동작 정상
- 스크롤 가능 모달(AddEventModal, EventSheetWithAdd) 정상 동작
- 8곳 모두 `<BottomSheet>` 사용으로 교체 완료

**컴포넌트 시그니처**:
```jsx
function BottomSheet({ onClose, children, scrollable = false }) {
  // position:fixed, inset:0, backdrop, slideUp 애니메이션
  // scrollable=true이면 maxHeight:"60vh", overflowY:"auto" 적용
}
```

---

### Sprint 2: 공용 ConfirmModal 컴포넌트 추출
**의존성**: Sprint 1 완료 후
**목표**: 쿠폰 사용/삭제 확인 팝업 2곳 중복 제거
**성공 기준**:
- `pnpm build` 통과
- CouponPage 사용 확인, CouponManagePage 삭제 확인 모두 정상 동작

**컴포넌트 시그니처**:
```jsx
function ConfirmModal({ emoji, title, message, onCancel, onConfirm, confirmLabel = "확인", confirmColor = C.primary }) {}
```

---

### Sprint 3: 공용 스타일 상수 추출
**의존성**: Sprint 1, 2 완료 후
**목표**: 각 모달마다 중복 선언되는 inputStyle, labelStyle 파일 상단 상수로 추출
**추출 위치**: `arrowBtn` 상수 근처 (L239)
**성공 기준**:
- `pnpm build` 통과
- 모든 input, label 스타일 시각적으로 동일 유지
- `inputStyle`, `labelStyle`, `modalSubmitBtn` 상수 5곳 이상에서 재사용

---

### Sprint 4: Supabase 서비스 레이어 추출
**의존성**: Sprint 1~3 완료 후
**목표**: `supabaseClient.js`에 DB 쿼리 함수들을 이전
**이전 대상**:
```js
// supabaseClient.js에 추가할 함수들
export async function loadFamily(userId) { ... }
export async function loadAllFamilyData(familyId) { ... }
export const todoDB = { add, toggle, delete, edit }
export const eventDB = { add }
export const couponDB = { add, delete, edit }
export const settingsDB = { upsertStars }
```
**성공 기준**:
- `pnpm build` 통과
- `src/FamilyDay.jsx` 내 supabase 직접 호출 0개 (import된 함수만 사용)
- 모든 CRUD 기능 정상 동작

---

### Sprint 5: useTodoManager 커스텀 훅 추출
**의존성**: Sprint 4 완료 후
**목표**: 루트 FamilyDay의 todos 관련 상태 + 핸들러를 훅으로 분리
**추출 내용**:
```js
function useTodoManager(familyId, dbLoaded) {
  // todos, setTodos
  // toggleTodo, deleteTodo, addTodo, editTodo
  // visibleTodos, momTodos, kidTodos, streak
  return { todos, visibleTodos, momTodos, kidTodos, streak, toggleTodo, deleteTodo, addTodo, editTodo }
}
```
**성공 기준**:
- `pnpm build` 통과
- 할 일 추가/완료/삭제/수정 모두 정상 동작
- 별 적립(star) 연동 정상 (toggleTodo에서 setStars 호출 유지)
- streak 연산 정상

---

### Sprint 6: useCouponManager + useEventManager 커스텀 훅 추출
**의존성**: Sprint 5 완료 후
**목표**: 루트 FamilyDay의 coupon, event 관련 상태를 각각 훅으로 분리
**성공 기준**:
- `pnpm build` 통과
- 일정 추가/삭제 정상
- 쿠폰 추가/삭제/수정 정상
- 별 차감 정상

---

## 평가 기준 (Evaluator용 채점표)

### 빌드 (필수, 0점이면 실패)
- [ ] `pnpm build` 성공 여부

### 기능 회귀 (각 10점, 총 70점)
- [ ] 인증: 로그인/로그아웃 UI 정상
- [ ] 할 일: 추가/완료/삭제/수정
- [ ] 별 모으기: 할 일 완료 시 카운트 증가
- [ ] 쿠폰: 사용/관리 기능
- [ ] 캘린더: 월간/주간 뷰 렌더
- [ ] 타임라인: 노드 렌더 정상
- [ ] 네비게이션: 탭 전환

### 코드 품질 (각 5점, 총 30점)
- [ ] 해당 스프린트 중복 제거 완료
- [ ] CLAUDE.md 제약 위반 없음
- [ ] 공용 컴포넌트/훅 시그니처가 spec과 일치

### 총점 기준
- 100점: 다음 스프린트 진행
- 80~99점: 경미한 수정 후 진행
- 80점 미만: Generator로 수정 요청 반환
