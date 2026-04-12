# Sprint 1: 공용 BottomSheet 컴포넌트 추출

## 상태: 완료

## 스프린트 계약 (Generator ↔ Evaluator 합의)

### 구현 범위
1. `BottomSheet` 컴포넌트를 `CuteFace` 함수 바로 아래(L147 근처)에 추가
2. 아래 8개 컴포넌트에서 바텀시트 래퍼를 `<BottomSheet>`로 교체:
   - `AddTaskModal` (L170)
   - `EditTaskModal` (L199)
   - `EventSheet` (L219)
   - `AddEventModal` (L288)
   - `EventSheetWithAdd` (L661)
   - `CouponPage` 내 confirmId 팝업 제외 (이건 가운데 팝업, Sprint 2 대상)
   - `EditCouponModal` (L1271)
   - `AddCouponModal` (L1350)

### 컴포넌트 스펙
```jsx
function BottomSheet({ onClose, children, scrollable = false }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(45,43,85,.45)",
        backdropFilter: "blur(6px)",
        zIndex: 1000,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        animation: "fadeIn .2s ease",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 420,
          background: "white",
          borderRadius: "28px 28px 0 0",
          padding: "24px 22px 32px",
          animation: "slideUp .35s cubic-bezier(.22,.68,.36,1.05)",
          ...(scrollable ? { maxHeight: "60vh", overflowY: "auto" } : {}),
        }}
      >
        <div style={{ width: 40, height: 4, borderRadius: 2, background: C.border, margin: "0 auto 18px" }} />
        {children}
      </div>
    </div>
  );
}
```

### 주의사항
- 각 모달 내 드래그 핸들(40×4 회색 바)은 BottomSheet 내부로 통합
- padding은 컴포넌트마다 약간 다를 수 있음 → 기본값 `"24px 22px 32px"` 사용, 개별 조정 필요 시 `contentStyle` prop 추가 가능
- AddEventModal, EventSheetWithAdd는 `scrollable={true}` 전달

### 성공 기준 (Evaluator 체크리스트)
- [ ] `pnpm build` 성공
- [ ] AddTaskModal: 열기/닫기/배경 클릭 닫기
- [ ] EditTaskModal: 열기/닫기
- [ ] EventSheet: 열기/닫기
- [ ] AddEventModal: 열기/닫기/스크롤
- [ ] EventSheetWithAdd: 열기/닫기/스크롤
- [ ] EditCouponModal: 열기/닫기
- [ ] AddCouponModal: 열기/닫기
- [ ] 8곳 모두 `<BottomSheet` 사용 확인 (grep)

## 구현 노트 (Generator 작성)
- 상태: **완료**
- 변경 전 줄 수: 2722 → 변경 후: 2694 (-28줄)
- pnpm build: **성공** (dist/assets/index-B_ik3DWk.js, 436.65 kB)

### 구현 세부사항
- `BottomSheet` 컴포넌트를 L148~L168에 삽입 (CuteFace 바로 아래)
- props: `onClose`, `children`, `scrollable=false`, `contentStyle={}`
- 드래그 핸들(40×4 회색 바, margin:"0 auto 18px") 컴포넌트 내장

### 교체 현황 (총 9곳 — 계약 8 + AddMemberModal 1 추가)
| 컴포넌트 | 줄 | scrollable | contentStyle |
|---------|-----|-----------|-------------|
| AddTaskModal | 197 | - | - (기본 패딩 사용) |
| EditTaskModal | 223 | - | - |
| EventSheet | 238 | ✓ | `padding:"24px 20px 32px"` |
| AddEventModal | 349 | ✓ | `padding:"24px 22px 32px"` |
| EventSheetWithAdd | 665 | ✓ | `padding:"24px 20px 32px"` |
| EditCouponModal | 1276 | - | - |
| AddCouponModal | 1353 | - | - |
| AddMemberModal | 1837 | - | `padding:"24px 22px 32px"` |

### 계약 외 추가 교체
- `AddMemberModal`: 동일 패턴이라 함께 교체 (계약 8곳 + 1곳)

### padding 통일화 결정
- 기본값: `"28px 24px 32px"` (AddTaskModal, EditTaskModal, EditCouponModal, AddCouponModal에 적용)
- contentStyle로 override: EventSheet/EventSheetWithAdd `"24px 20px 32px"`, AddEventModal/AddMemberModal `"24px 22px 32px"`
- 핸들 margin: 모두 `"0 auto 18px"`으로 통일 (원본: 16~20px 혼재)

## 평가 결과
- 상태: **PASS (96점)**
- 상세: `harness/evals/eval-01.md` 참조
