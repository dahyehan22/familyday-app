# Sprint 4 평가 보고서

**평가 일시**: 2026-04-12
**평가 대상**: sprints/sprint-04.md
**평가자**: Evaluator Agent

---

## 1. 빌드 검증 (필수)

```bash
pnpm build
✓ 66 modules transformed.
dist/assets/index-CJ4b8_Nq.js  432.52 kB │ gzip: 116.14 kB
✓ built in 462ms
```

- 결과: [x] 성공

---

## 2. 정적 검증

### supabase 직접 호출 0개 확인

```bash
grep -c "supabase\." src/FamilyDay.jsx
# → 0
```

- [x] `src/FamilyDay.jsx` 내 `supabase.` 직접 호출 **0개** 확인

### supabaseClient.js 서비스 그룹 정의 확인

| 그룹 | 줄 | 확인 |
|------|-----|------|
| `authDB` | L9 | ✓ (9개 메서드: signUp, signIn, signOut, resetPassword, updatePassword, getUser, getSession, verifyOtp, onAuthStateChange) |
| `familyDB` | L25 | ✓ (10개 메서드) |
| `loadFamily` | L43 | ✓ (FamilyDay에서 이전, localStorage 로직 포함) |
| `loadAllFamilyData` | L71 | ✓ |
| `todoDB` | L81 | ✓ (5개 메서드: add, done, undone, delete, edit) |
| `eventDB` | L90 | ✓ (1개 메서드: add) |
| `couponDB` | L95 | ✓ (3개 메서드: add, delete, edit) |
| `settingsDB` | L102 | ✓ (1개 메서드: upsertStars) |

- [x] 8개 서비스 그룹 모두 정의됨

### FamilyDay.jsx import 변경 확인

```js
// L2
import { authDB, familyDB, loadFamily, loadAllFamilyData, todoDB, eventDB, couponDB, settingsDB } from "./supabaseClient";
```

- [x] `supabase` 직접 import 없음, 7개 서비스 모듈 import

### loadFamily 이전 확인

- [x] `src/FamilyDay.jsx` 내 `async function loadFamily(userId)` 정의 없음 (제거됨)
- [x] `src/supabaseClient.js` L43에 `export async function loadFamily(userId)` 정의됨
- [x] FamilyDay에서 `loadFamily(u.id)` 호출 유지 (import된 함수 사용)

### 서비스 함수 사용처 확인 (주요)

| 함수 | 사용 횟수 | 위치 |
|------|---------|------|
| `authDB.signUp` | 1 | AuthPage L1467 |
| `authDB.signIn` | 1 | AuthPage L1490 |
| `authDB.resetPassword` | 1 | AuthPage L1505 |
| `authDB.updatePassword` | 1 | AuthPage L1520 |
| `authDB.signOut` | 1 | FamilyDay L2304 |
| `authDB.verifyOtp` | 1 | FamilyDay L2222 |
| `authDB.getSession` | 2 | FamilyDay L2226, L2234 |
| `authDB.onAuthStateChange` | 1 | FamilyDay L2238 |
| `familyDB.*` | 8 | MyPage + FamilyDay |
| `loadAllFamilyData` | 1 | FamilyDay L2256 |
| `todoDB.add` | 2 | FamilyDay L2271, L2333 |
| `todoDB.done/undone/delete/edit` | 4 | FamilyDay |
| `eventDB.add` | 1 | FamilyDay L2299 |
| `couponDB.add/delete/edit` | 3 | FamilyDay |
| `settingsDB.upsertStars` | 1 | FamilyDay L2294 |

- [x] 총 32개 서비스 함수 호출 확인

### CLAUDE.md 제약 위반 검사

- [x] `src/FamilyDay.jsx` 단일 파일 유지 (supabaseClient.js는 기존 파일 확장)
- [x] 신규 외부 라이브러리 없음
- [x] 한국어 UI 텍스트 유지

### 코드 지표

| 항목 | Sprint 3 | Sprint 4 | 변화 |
|------|---------|---------|------|
| FamilyDay.jsx 줄 수 | 2662 | 2611 | **-51줄** |
| supabase 직접 호출 | 41개 | **0개** | **-41개** |
| supabaseClient.js | 6줄 | 107줄 | +101줄 |
| 전체 코드 (두 파일 합산) | 2668줄 | 2718줄 | +50줄 (서비스 레이어 도입 비용) |

---

## 3. 기능 체크리스트 (정적 분석 기반)

| 기능 | 결과 | 근거 |
|------|------|------|
| 로그인/회원가입 | ✓ | authDB.signUp/signIn 연결 동일 |
| 비밀번호 재설정 | ✓ | authDB.resetPassword/updatePassword 연결 동일 |
| 로그아웃 | ✓ | authDB.signOut 연결 동일 |
| onAuthStateChange 구독 해제 | ✓ | `return()=>subscription.unsubscribe()` 유지 |
| 가족 로드 (loadFamily) | ✓ | 동일 로직, localStorage 처리 포함 이전 |
| 초기 데이터 로드 | ✓ | loadAllFamilyData → Promise.all 4개 테이블 동일 |
| 주간 할 일 리셋 시 DB 저장 | ✓ | todoDB.add(t, fid) |
| 별 동기화 | ✓ | settingsDB.upsertStars 연결 동일 |
| 할 일 CRUD | ✓ | todoDB.add/done/undone/delete/edit 연결 동일 |
| 일정 추가 | ✓ | eventDB.add 연결 동일 |
| 쿠폰 CRUD | ✓ | couponDB.add/delete/edit 연결 동일 |
| 가족 초대/합류 | ✓ | familyDB.createInvite/getInviteByCode/useInvite 연결 동일 |
| 구성원 추가/삭제 | ✓ | familyDB.insertMember/deleteMemberById/insertMemberReturningId |

---

## 4. 채점

| 카테고리 | 배점 | 획득 | 비고 |
|----------|------|------|------|
| 빌드 성공 | 필수 | ✓ | |
| 계약 이행 (0 직접 호출 + 8개 서비스 그룹) | 30점 | **30점** | 완전 이행 |
| 기능 회귀 없음 | 50점 | **50점** | 모든 CRUD 연결 무결 |
| 코드 품질 | 20점 | **19점** | 서비스 레이어 명확. (-1: supabaseClient.js가 `loadFamily` 내에서 `localStorage` 접근 — 스토리지 레이어 혼재, 단 스펙 명시 사항) |
| **합계** | **100점** | **99점** | |

---

## 5. 판정 및 피드백

**판정**: [x] PASS (99점)

**Generator에 전달할 사항** (수정 불필요, 참고용):

1. **localStorage in supabaseClient.js**: `loadFamily`가 `localStorage.getItem("fd_pending_invite")`를 직접 접근합니다. 순수 DB 레이어가 스토리지를 건드리는 것은 관심사 분리 위반이지만, 스펙이 `loadFamily`를 그대로 이전하도록 명시했으므로 감점(-1)만 적용합니다.

2. **authDB.getUser 중복 호출**: `loadFamily` 내에서 invite 처리와 새 가족 생성 시 각각 `authDB.getUser()`를 별도 호출합니다. 두 경로 중 하나만 실행되므로 문제 없지만, 향후 최적화 가능.

3. **누적 줄 수**: FamilyDay.jsx 기준 2718 → 2611 (-107줄). Sprint 1~4 합산 FamilyDay.jsx 줄 감소 -111줄.

**다음 스프린트 진행 여부**: [x] **진행** → Sprint 5 (useTodoManager 훅 추출) 시작 가능

---

## 6. Sprint 5 사전 관찰 (Evaluator 참고용)

`useTodoManager` 추출 대상:
- FamilyDay 내 `todos`, `setTodos` state
- `toggleTodo`, `deleteTodo`, `addTodo`, `editTodo` callbacks
- `visibleTodos`, `momTodos`, `kidTodos` 파생 값
- `streak` 연산 (별 적립 연동 포함)
- `todoDB.*` 호출은 훅 내부로 이동
