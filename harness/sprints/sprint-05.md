# Sprint 5: useTodoManager 커스텀 훅 추출

## 상태: 완료

## 스프린트 계약 (Generator ↔ Evaluator 합의)

### 구현 범위
1. `src/FamilyDay.jsx`에 `useTodoManager(familyId, setStars)` 훅 추가
2. FamilyDay 루트 컴포넌트에서 `todos` 관련 상태/핸들러/파생값 훅으로 이동
3. FamilyDay에서 훅 호출로 교체

### 훅 시그니처

```js
function useTodoManager(familyId, setStars) {
  const [todos, setTodos] = useState([]);

  const toggleTodo = useCallback(id => {
    const dk = fmtDateKey(new Date());
    setTodos(prev => prev.map(t => {
      if (t.id === id && !t.isDone) {
        setStars(s => s + t.starReward);
        const updated = {...t, isDone: true, doneDate: dk};
        todoDB.done(id, dk);
        return updated;
      }
      if (t.id === id && t.isDone && t.owner === "mom") {
        todoDB.undone(id);
        return {...t, isDone: false, doneDate: undefined};
      }
      return t;
    }));
  }, [setStars]);

  const deleteTodo = useCallback(id => {
    setTodos(p => p.filter(t => t.id !== id));
    todoDB.delete(id);
  }, []);

  const addTodo = useCallback(item => {
    setTodos(p => [...p, item]);
    todoDB.add(item, familyId);
  }, [familyId]);

  const editTodo = useCallback(updated => {
    setTodos(p => p.map(t => t.id === updated.id ? updated : t));
    todoDB.edit(updated);
  }, []);

  const today = new Date();
  const todayKey = fmtDateKey(today);
  const curWeekStart = fmtDateKey(getWeekStartDate(today));
  const visibleTodos = todos.filter(t => {
    const todoWeekStart = fmtDateKey(getWeekStartDate(new Date(t.createdDate + "T00:00:00")));
    if (todoWeekStart !== curWeekStart) return false;
    if (!t.isDone) return true;
    return t.doneDate === todayKey;
  });
  const momTodos = visibleTodos.filter(t => t.owner === "mom");
  const kidTodos = visibleTodos.filter(t => t.owner === "kid");

  const streak = useMemo(() => {
    const kidDone = todos.filter(t => t.owner === "kid" && t.isDone && t.doneDate);
    const doneDates = [...new Set(kidDone.map(t => t.doneDate))].sort().reverse();
    if (doneDates.length === 0) return 0;
    let count = 0;
    const d = new Date();
    for (let i = 0; i < 60; i++) {
      const key = fmtDateKey(d);
      if (doneDates.includes(key)) { count++; d.setDate(d.getDate() - 1); }
      else if (i === 0) { d.setDate(d.getDate() - 1); continue; }
      else break;
    }
    return count;
  }, [todos]);

  return { todos, setTodos, visibleTodos, momTodos, kidTodos, streak, toggleTodo, deleteTodo, addTodo, editTodo };
}
```

### FamilyDay 루트 변경

```js
// Before: 개별 선언
const [todos, setTodos] = useState([]);
// ... (toggleTodo, deleteTodo, addTodo, editTodo, visibleTodos, momTodos, kidTodos, streak 개별 선언)

// After: 훅 호출로 교체 (setStars 선언 이후)
const { todos, setTodos, visibleTodos, momTodos, kidTodos, streak,
        toggleTodo, deleteTodo, addTodo, editTodo } = useTodoManager(user?.familyId, setStars);
```

### 훅 배치 위치
- `ConfirmModal` 함수 정의 바로 아래, `TodoItem` 함수 위에 삽입

### 제거 대상 (FamilyDay 루트에서)
- `const [todos, setTodos] = useState([]);` 선언
- `const toggleTodo = useCallback(...)` 4개 핸들러
- `const visibleTodos`, `const momTodos`, `const kidTodos` (3개 파생값)
- `const streak = useMemo(...)` 연산

### 성공 기준 (Evaluator 체크리스트)
- [ ] `pnpm build` 성공
- [ ] `function useTodoManager` 정의가 FamilyDay.jsx에 존재
- [ ] FamilyDay 루트에 `const [todos, setTodos] = useState([])` 없음 (훅 내부로 이동)
- [ ] FamilyDay 루트에 `toggleTodo`, `deleteTodo`, `addTodo`, `editTodo` useCallback 선언 없음
- [ ] FamilyDay 루트에 `visibleTodos`, `momTodos`, `kidTodos` 직접 선언 없음
- [ ] FamilyDay 루트에 `streak` useMemo 선언 없음
- [ ] `useTodoManager` 훅 호출이 FamilyDay 루트에 존재
- [ ] 별 적립 정상 (`toggleTodo`에서 `setStars` 호출)
- [ ] `setTodos`가 `loadAll()` 내 주간 리셋 로직에서 정상 사용

## 구현 노트 (Generator 작성)
- 상태: **완료**
- Sprint 4 후 줄 수: 2611 → Sprint 5 후: 2615 (+4줄 순증가)
  - 훅 정의 추가 (+55줄) - FamilyDay에서 제거 (-51줄)
- pnpm build: **성공** (dist/assets/index-BScv8fNd.js, 432.83 kB)

### 훅 배치
| 항목 | 줄 | 설명 |
|------|-----|------|
| `function useTodoManager` | L200 | BottomSheet/ConfirmModal 다음, TodoItem 앞에 삽입 |
| `useTodoManager` 호출 | L2234 | `setStars` 선언 직후 |

### FamilyDay 제거 항목
| 항목 | 설명 |
|------|------|
| `const [todos, setTodos] = useState([])` | 훅 내부로 이동 |
| `toggleTodo` useCallback | 훅 내부로 이동 |
| `deleteTodo` useCallback | 훅 내부로 이동 |
| `addTodo` useCallback | 훅 내부로 이동 |
| `editTodo` useCallback | 훅 내부로 이동 |
| `visibleTodos` 파생값 | 훅 내부로 이동 |
| `momTodos` 파생값 | 훅 내부로 이동 |
| `kidTodos` 파생값 | 훅 내부로 이동 |
| `streak` useMemo | 훅 내부로 이동 |

### 설계 결정
- `setStars`를 두 번째 매개변수로 전달 (toggleTodo에서 별 적립 시 호출)
- `setTodos`를 반환값에 포함 (FamilyDay의 `loadAll()`에서 주간 리셋 시 사용)
- `today`, `todayKey`, `curWeekStart` 계산을 훅 내부에 포함

## 평가 결과
- 상태: **PASS (99점)**
- 상세: `harness/evals/eval-05.md` 참조
