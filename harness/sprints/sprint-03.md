# Sprint 3: 공용 스타일 상수 추출

## 상태: 완료

## 스프린트 계약 (Generator ↔ Evaluator 합의)

### 구현 범위
1. `arrowBtn` 상수 바로 뒤 (현재 L281)에 파일 레벨 공용 스타일 상수 3개 추가:
   - `labelStyle` — form label 공통 스타일
   - `inputStyle` — text/date/time input 공통 스타일  
   - `modalSubmitBtn` — 모달 제출 버튼 공통 스타일 함수
2. 아래 3곳의 내부 `inputStyle` 선언 제거 후 파일 레벨 상수로 교체:
   - `AddEventModal` (L370~375)
   - `AuthPage` (L1483~1489)
   - `AddMemberModal` (L1852~1858)
3. `labelStyle` 6곳 이상에서 적용
4. `modalSubmitBtn` 6곳에서 적용:
   - `AddTaskModal`, `EditTaskModal`, `AddEventModal`, `EditCouponModal`, `AddCouponModal`, `AddMemberModal`

### 중복 현황 (Before)

| 상수 | 현재 위치 | 인스턴스 수 |
|------|---------|-----------|
| `inputStyle` | AddEventModal(L370), AuthPage(L1483), AddMemberModal(L1852) | 3곳 |
| label style | 인라인 (AddEventModal 6개, AuthPage 8개, AddMemberModal 3개, AppSettings 2개) | 19곳+ |
| modalSubmitBtn | AddTaskModal(L241), EditTaskModal(L258), AddEventModal(L531), EditCouponModal(L1348), AddCouponModal(L1441), AddMemberModal(L1905) | 6곳 |

### 공용 상수 스펙

```js
const labelStyle = {
  fontSize:12, fontWeight:700, color:C.textMid, marginBottom:6, display:"block"
};

const inputStyle = {
  width:"100%", padding:"12px 14px", borderRadius:14,
  border:`2px solid ${C.border}`, fontSize:14, fontWeight:600,
  fontFamily:"'Nunito',sans-serif", color:C.textDark,
  outline:"none", background:C.bg, transition:"border .2s", boxSizing:"border-box",
};

const modalSubmitBtn = active => ({
  width:"100%", padding:"14px", borderRadius:16, border:"none",
  background: active ? `linear-gradient(135deg,${C.primary},${C.primaryLight})` : C.border,
  color: active ? "white" : C.textLight,
  fontSize:16, fontWeight:800, fontFamily:"'Nunito',sans-serif",
  cursor: active ? "pointer" : "default",
  boxShadow: active ? "0 4px 16px rgba(108,99,255,.35)" : "none",
  transition: "all .2s",
});
```

### 교체 후 사용 예시

```jsx
// labelStyle
<label style={labelStyle}>이름</label>
<label style={{...labelStyle, marginBottom:8}}>아이콘</label>

// inputStyle
<input style={{...inputStyle, marginBottom:16}} ... />
// AuthPage는 padding/background 다름 → spread override
<input style={{...inputStyle, padding:"14px 16px", background:"white", marginBottom:14}} ... />

// modalSubmitBtn
<button style={{...modalSubmitBtn(text.trim()), marginTop:16}}>할 일 추가 ✨</button>
<button style={modalSubmitBtn(valid)}>쿠폰 추가하기</button>
```

### 통일화 결정
- `inputStyle` padding: "12px 14px" 기준 (AddEventModal·AddMemberModal 기준)
- `inputStyle` background: C.bg 기준
- AuthPage는 padding:"14px 16px", background:"white" override 사용
- `labelStyle` marginBottom: 6 기준 (marginBottom:8이 필요한 곳은 spread override)
- `modalSubmitBtn`에 transition:"all .2s" 포함 (없던 곳 포함해도 동작 무관)
- AddTask/EditTaskModal은 marginTop:16 별도 override 필요

### 성공 기준 (Evaluator 체크리스트)
- [ ] `pnpm build` 성공
- [ ] `labelStyle`, `inputStyle`, `modalSubmitBtn` 파일 레벨 상수 정의 확인 (grep)
- [ ] 내부 `const inputStyle` 선언 0개 (grep "const inputStyle" → 0)
- [ ] `modalSubmitBtn` 6곳 사용 확인 (grep)
- [ ] `labelStyle` 6곳 이상 사용 확인 (grep)
- [ ] 줄 수 감소 (순증가 없어야 함)

## 구현 노트 (Generator 작성)
- 상태: **완료**
- Sprint 2 후 줄 수: 2718 → Sprint 3 후: 2662 (-56줄)
  - 상수 3개 추가(+3줄) + 내부 inputStyle 3개 제거(-21줄) + label 인라인 → 상수 교체(-9줄) + modalSubmitBtn 교체(-29줄) = 순감소
- pnpm build: **성공** (dist/assets/index-CI9JlEf0.js, 431.92 kB)

### 추가된 상수 위치
| 상수 | 줄 | 설명 |
|------|-----|------|
| `labelStyle` | L282 | form label 공통 스타일 |
| `inputStyle` | L283 | input 공통 스타일 |
| `modalSubmitBtn` | L284 | 제출 버튼 스타일 함수 |

### inputStyle 교체 현황
| 컴포넌트 | 변경 내용 |
|---------|---------|
| AddEventModal | 내부 선언 제거, 파일 레벨 `inputStyle` 사용 (4개 input) |
| AuthPage | 내부 선언 제거, `authInputStyle={...inputStyle, padding:"14px 16px", background:"white"}` 로컬 override 사용 (6개 input) |
| AddMemberModal | 내부 선언 제거, 파일 레벨 `inputStyle` 사용 (1개 input) |
| MyPage (joinCode) | 인라인 스타일 → `inputStyle` spread 교체 |

### labelStyle 교체 현황 (총 22곳)
- AddEventModal: 7개 label (일정이름·날짜·시작·종료·아이콘·색상·반복·반복요일)
- AuthPage: 8개 label (새비밀번호·비밀번호확인·이메일×2·비밀번호·초대코드·역할·아이콘)
- AddMemberModal: 3개 label (이름·역할·아이콘)
- MyPage: 3개 label (초대코드·역할·아이콘)

### modalSubmitBtn 교체 현황 (총 6곳)
| 컴포넌트 | active 조건 | 비고 |
|---------|------------|------|
| AddTaskModal | `text.trim()` | `marginTop:16` override |
| EditTaskModal | `text.trim()` | `marginTop:16` override |
| AddEventModal | `title.trim()&&date` | - |
| EditCouponModal | `valid` | - |
| AddCouponModal | `valid` | - |
| AddMemberModal | `name.trim()` | - |

## 평가 결과
- 상태: **PASS (99점)**
- 상세: `harness/evals/eval-03.md` 참조
