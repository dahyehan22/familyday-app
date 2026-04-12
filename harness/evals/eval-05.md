# Sprint 5 평가 보고서

**평가 일시**: 2026-04-12
**평가 대상**: sprints/sprint-05.md
**평가자**: Evaluator Agent

---

## 1. 빌드 검증 (필수)

```bash
pnpm build
✓ 66 modules transformed.
dist/assets/index-BScv8fNd.js  432.83 kB │ gzip: 116.39 kB
✓ built in 478ms
```

- 결과: [x] 성공

---

## 2. 정적 검증

### useTodoManager 훅 정의 확인

```bash
grep -n "function useTodoManager" src/FamilyDay.jsx
# → 200:function useTodoManager(familyId,setStars)
```

- [x] `function useTodoManager` L200에 정의됨
- [x] 매개변수: `familyId`, `setStars` (별 적립 연동)

### FamilyDay 루트 내 todos 상태 선언 제거 확인

```bash
grep -n "const \[todos" src/FamilyDay.jsx
# → 201: 훅 내부 (useTodoManager 범위)
# → 2315: [todosRes,...] 구조분해 (상태 선언 아님)
```

- [x] FamilyDay 루트에 `const [todos, setTodos] = useState([])` 없음 (훅 내부로 이동)

### useCallback 핸들러 제거 확인

```bash
grep -n "const toggleTodo\|const deleteTodo\|const addTodo\|const editTodo" src/FamilyDay.jsx
# → 202, 218, 222, 226: 모두 useTodoManager 훅 내부 (L200~255)
```

- [x] FamilyDay 루트에 `toggleTodo`, `deleteTodo`, `addTodo`, `editTodo` useCallback 선언 없음

### 파생값 제거 확인

```bash
grep -n "const visibleTodos\|const momTodos\|const kidTodos" src/FamilyDay.jsx
# → 233, 239, 240: 모두 useTodoManager 훅 내부
```

- [x] FamilyDay 루트에 `visibleTodos`, `momTodos`, `kidTodos` 직접 선언 없음

### streak 제거 확인

```bash
grep -n "const streak=useMemo" src/FamilyDay.jsx
# → 241: useTodoManager 훅 내부
```

- [x] FamilyDay 루트에 `streak` useMemo 선언 없음

### 훅 호출 확인

```js
// L2234
const {todos,setTodos,visibleTodos,momTodos,kidTodos,streak,toggleTodo,deleteTodo,addTodo,editTodo}=useTodoManager(user?.familyId,setStars);
```

- [x] `useTodoManager` 훅 호출이 FamilyDay 루트에 존재
- [x] `setStars` 선언 직후 호출 (별 적립 연동)

### setTodos 사용 확인 (주간 리셋)

```bash
grep -n "setTodos" src/FamilyDay.jsx
# → L2328: setTodos(newTodos) — 주간 리셋 시 새 할일 적용
# → L2332: setTodos(mapped) — 일반 로드 시 적용
```

- [x] `setTodos`가 `loadAll()` 내 주간 리셋 로직에서 정상 사용

### CLAUDE.md 제약 위반 검사

- [x] `src/FamilyDay.jsx` 단일 파일 유지 (훅도 동일 파일 내 정의)
- [x] 신규 외부 라이브러리 없음
- [x] 한국어 UI 텍스트 유지

### 코드 지표

| 항목 | Sprint 4 | Sprint 5 | 변화 |
|------|---------|---------|------|
| FamilyDay.jsx 줄 수 | 2611 | 2615 | +4줄 (훅 도입 순비용) |
| 훅 정의 | 없음 | useTodoManager (L200~255) | +56줄 |
| FamilyDay 루트 제거 | — | 9개 항목 (-52줄) | |

---

## 3. 기능 체크리스트 (정적 분석 기반)

| 기능 | 결과 | 근거 |
|------|------|------|
| 할 일 추가 | ✓ | `addTodo` 훅 내부에서 `todoDB.add(item, familyId)` 연결 |
| 할 일 완료 (엄마) | ✓ | `toggleTodo` mom 경로: `todoDB.done/undone` 연결 |
| 할 일 완료 (아이) | ✓ | `toggleTodo` kid 경로: `setStars(s=>s+t.starReward)` + `todoDB.done` |
| 별 적립 | ✓ | `setStars` 매개변수로 전달, 완료 시 호출 |
| 할 일 삭제 | ✓ | `deleteTodo` → `todoDB.delete(id)` |
| 할 일 수정 | ✓ | `editTodo` → `todoDB.edit(updated)` |
| visibleTodos 필터 | ✓ | 이번 주 할일만, 완료는 오늘 것만 표시 로직 유지 |
| momTodos / kidTodos | ✓ | `visibleTodos`에서 owner 필터링 |
| streak 계산 | ✓ | `useMemo([todos])` — kid 완료일 기준 연속 달성 계산 |
| 주간 리셋 (DB 로드) | ✓ | `setTodos` 반환값으로 `loadAll()` 에서 사용 |
| 초기 데이터 로드 | ✓ | `loadAll()`에서 `setTodos(mapped)` 정상 동작 |

---

## 4. 채점

| 카테고리 | 배점 | 획득 | 비고 |
|----------|------|------|------|
| 빌드 성공 | 필수 | ✓ | |
| 계약 이행 (훅 정의 + FamilyDay 루트 정리) | 30점 | **30점** | 9개 항목 모두 이동 완료 |
| 기능 회귀 없음 | 50점 | **50점** | CRUD + 별 적립 + streak 모두 연결 유지 |
| 코드 품질 | 20점 | **19점** | 훅 시그니처 명확, setStars 의존 투명. (-1: `today/todayKey/curWeekStart`가 훅 내부에서 매 렌더마다 재계산 — `useMemo` 미적용, 단 기존 코드와 동일 패턴) |
| **합계** | **100점** | **99점** | |

---

## 5. 판정 및 피드백

**판정**: [x] PASS (99점)

**Generator에 전달할 사항** (수정 불필요, 참고용):

1. **today/todayKey/curWeekStart 재계산**: 훅 내부에서 매 렌더마다 `new Date()` 를 재호출합니다. 기존 FamilyDay와 동일 패턴이므로 회귀 아님. 향후 `useMemo(()=>new Date(),[])` 적용 가능.

2. **setTodos 반환 노출**: 훅이 `setTodos`를 외부로 노출합니다. `loadAll()` 초기화를 위해 필요하지만, 순수 인터페이스 관점에서는 `initTodos(data)` 메서드로 추상화하는 것이 더 명확합니다. Sprint 6에서 개선 가능.

3. **줄 수 증가**: Sprint 1~5 합산 FamilyDay.jsx 기준 누적 변화: Sprint 1(-27) + Sprint 2(-28) + Sprint 3(-28) + Sprint 4(-51) + Sprint 5(+4) = **-130줄**. 전체적으로 코드 감소 추세.

**다음 스프린트 진행 여부**: [x] **진행** → Sprint 6 (useCouponManager + useEventManager) 시작 가능

---

## 6. Sprint 6 사전 관찰 (Evaluator 참고용)

`useCouponManager` 추출 대상:
- `coupons`, `setCoupons` state
- `addCoupon`, `deleteCoupon`, `editCoupon` callbacks
- `couponDB.*` 호출

`useEventManager` 추출 대상:
- `events`, `setEvents` state
- `addEvent` callback
- `eventDB.*` 호출

`spendStars` (쿠폰 사용 시 별 차감) 연동 유지 필요
