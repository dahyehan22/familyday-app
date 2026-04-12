# Sprint 6: useCouponManager + useEventManager 커스텀 훅 추출

## 상태: 완료

## 스프린트 계약 (Generator ↔ Evaluator 합의)

### 구현 범위
1. `src/FamilyDay.jsx`에 `useEventManager(familyId)` 훅 추가
2. `src/FamilyDay.jsx`에 `useCouponManager(familyId)` 훅 추가
3. FamilyDay 루트에서 관련 상태/핸들러 제거 후 훅 호출로 교체

### 훅 시그니처

```js
function useEventManager(familyId) {
  const [events, setEvents] = useState([]);
  const addEvent = useCallback(ev => {
    setEvents(p => [...p, ev]);
    eventDB.add(ev, familyId);
  }, [familyId]);
  return { events, setEvents, addEvent };
}

function useCouponManager(familyId) {
  const [coupons, setCoupons] = useState([]);
  const addCoupon = useCallback(c => {
    setCoupons(p => [...p, c].sort((a, b) => a.starCost - b.starCost));
    couponDB.add(c, familyId);
  }, [familyId]);
  const deleteCoupon = useCallback(id => {
    setCoupons(p => p.filter(c => c.id !== id));
    couponDB.delete(id);
  }, []);
  const editCoupon = useCallback(updated => {
    setCoupons(p => p.map(c => c.id === updated.id ? updated : c).sort((a, b) => a.starCost - b.starCost));
    couponDB.edit(updated);
  }, []);
  return { coupons, setCoupons, addCoupon, deleteCoupon, editCoupon };
}
```

### FamilyDay 루트 변경

```js
// Before
const [events, setEvents] = useState([]);
const [coupons, setCoupons] = useState([]);
// addEvent, addCoupon, deleteCoupon, editCoupon 개별 선언

// After (user 선언 이후, 또는 familyId 접근 가능한 시점)
const { events, setEvents, addEvent } = useEventManager(user?.familyId);
const { coupons, setCoupons, addCoupon, deleteCoupon, editCoupon } = useCouponManager(user?.familyId);
```

### 훅 배치 위치
- `useTodoManager` 훅 정의 바로 아래, `TodoItem` 앞에 삽입

### 유지 항목
- `spendStars = useCallback(cost => setStars(...), [])` — stars 관련이므로 FamilyDay 루트에 유지

### 제거 대상 (FamilyDay 루트에서)
- `const [events, setEvents] = useState([])`
- `const [coupons, setCoupons] = useState([])`
- `const addEvent = useCallback(...)`
- `const addCoupon = useCallback(...)`
- `const deleteCoupon = useCallback(...)`
- `const editCoupon = useCallback(...)`

### 성공 기준 (Evaluator 체크리스트)
- [ ] `pnpm build` 성공
- [ ] `function useEventManager` 정의가 FamilyDay.jsx에 존재
- [ ] `function useCouponManager` 정의가 FamilyDay.jsx에 존재
- [ ] FamilyDay 루트에 `const [events, setEvents] = useState([])` 없음
- [ ] FamilyDay 루트에 `const [coupons, setCoupons] = useState([])` 없음
- [ ] FamilyDay 루트에 `addEvent`, `addCoupon`, `deleteCoupon`, `editCoupon` useCallback 선언 없음
- [ ] `useEventManager`, `useCouponManager` 훅 호출이 FamilyDay 루트에 존재
- [ ] `setEvents`, `setCoupons`가 `loadAll()` 내 초기 데이터 로드에서 정상 사용
- [ ] 별 차감(`spendStars`) FamilyDay 루트에 유지

## 구현 노트 (Generator 작성)
- 상태: **완료**
- Sprint 5 후 줄 수: 2615 → Sprint 6 후: 2627 (+12줄 순증가)
  - 2개 훅 정의 추가 (+24줄) - FamilyDay에서 6개 항목 제거 (-12줄)
- pnpm build: **성공** (dist/assets/index-CB5TbhTX.js, 433.07 kB)

### 훅 배치
| 훅 | 줄 | 설명 |
|----|-----|------|
| `function useEventManager` | L259 | useTodoManager 다음, useCouponManager 앞 |
| `function useCouponManager` | L269 | useEventManager 다음, TodoItem 앞 |
| `useEventManager` 호출 | L2262 | useTodoManager 호출 직후 |
| `useCouponManager` 호출 | L2263 | useEventManager 호출 직후 |

### FamilyDay 제거 항목
| 항목 | 설명 |
|------|------|
| `const [events, setEvents] = useState([])` | useEventManager 내부로 이동 |
| `const [coupons, setCoupons] = useState([])` | useCouponManager 내부로 이동 |
| `addEvent` useCallback | useEventManager 내부로 이동 |
| `addCoupon` useCallback | useCouponManager 내부로 이동 |
| `deleteCoupon` useCallback | useCouponManager 내부로 이동 |
| `editCoupon` useCallback | useCouponManager 내부로 이동 |

### 설계 결정
- `spendStars`는 FamilyDay 루트에 유지 (별 도메인, coupons 훅 범위 아님)
- `setEvents`/`setCoupons` 반환값 포함 (loadAll() 초기 데이터 로드용)

## 평가 결과
- 상태: **PASS (100점)**
- 상세: `harness/evals/eval-06.md` 참조
