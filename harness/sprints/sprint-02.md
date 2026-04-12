# Sprint 2: 공용 ConfirmModal 컴포넌트 추출

## 상태: 완료

## 스프린트 계약 (Generator ↔ Evaluator 합의)

### 구현 범위
1. `ConfirmModal` 컴포넌트를 `BottomSheet` 바로 아래에 추가
2. 아래 2곳의 가운데 확인 팝업을 `<ConfirmModal>`로 교체:
   - `CouponPage` 사용 확인 팝업 (L1135~L1148)
   - `CouponManagePage` 삭제 확인 팝업 (L1237~L1249)

### 두 팝업 구조 분석 (Before)

| 속성 | CouponPage (사용) | CouponManagePage (삭제) |
|------|-----------------|----------------------|
| emoji | `{found.emoji}` (동적) | `🗑️` |
| title | 쿠폰을 사용할까요? | 쿠폰을 삭제할까요? |
| subtitle | `{found.title}` | (없음) |
| message | ★ {found.starCost}개의 별이 차감됩니다 | 삭제하면 아이가 더 이상 사용할 수 없어요. |
| confirmLabel | 사용하기 | 삭제 |
| confirmColor | `C.primary` (보라) | `C.secondary` (빨강) |

### 컴포넌트 스펙
```jsx
function ConfirmModal({ emoji, title, subtitle, message, onCancel, onConfirm, confirmLabel = "확인", confirmColor = C.primary }) {
  return (
    <div onClick={onCancel} style={{
      position: "fixed", inset: 0, background: "rgba(45,43,85,.45)",
      backdropFilter: "blur(6px)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center",
      animation: "fadeIn .2s ease",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "85%", maxWidth: 320, background: "white",
        borderRadius: 24, padding: "32px 24px 24px",
        textAlign: "center", animation: "pop .35s cubic-bezier(.22,.68,.36,1.05)",
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>{emoji}</div>
        <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 900, color: C.textDark, fontFamily: "'Nunito',sans-serif" }}>{title}</h3>
        {subtitle && <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: C.textDark }}>{subtitle}</p>}
        <p style={{ margin: "0 0 24px", fontSize: 13, fontWeight: 600, color: C.textMid }}>{message}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "12px", borderRadius: 14, border: `2px solid ${C.border}`, background: "white", color: C.textMid, fontSize: 15, fontWeight: 800, fontFamily: "'Nunito',sans-serif", cursor: "pointer" }}>취소</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: "12px", borderRadius: 14, border: "none", background: `linear-gradient(135deg,${confirmColor},${confirmColor}DD)`, color: "white", fontSize: 15, fontWeight: 800, fontFamily: "'Nunito',sans-serif", cursor: "pointer", boxShadow: `0 4px 16px ${confirmColor}55` }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 교체 후 사용 예시
```jsx
// CouponPage — 사용 확인
{found && (
  <ConfirmModal
    emoji={found.emoji}
    title="쿠폰을 사용할까요?"
    subtitle={found.title}
    message={`★ ${found.starCost}개의 별이 차감됩니다`}
    onCancel={() => setConfirmId(null)}
    onConfirm={confirmUse}
    confirmLabel="사용하기"
  />
)}

// CouponManagePage — 삭제 확인
{deleteConfirm && (
  <ConfirmModal
    emoji="🗑️"
    title="쿠폰을 삭제할까요?"
    message="삭제하면 아이가 더 이상 사용할 수 없어요."
    onCancel={() => setDeleteConfirm(null)}
    onConfirm={() => { onDelete(deleteConfirm); setDeleteConfirm(null); }}
    confirmLabel="삭제"
    confirmColor={C.secondary}
  />
)}
```

### 통일화 결정 (원본과 미세 차이)
- maxWidth: 300 vs 320 → **320으로 통일**
- padding: "28px 24px 24px" vs "32px 24px 24px" → **"32px 24px 24px"으로 통일**
- 타이틀 fontSize: 17 vs 18 → **18로 통일**
- 이모지 fontSize: 40 vs 48 → **48로 통일**

### 성공 기준 (Evaluator 체크리스트)
- [ ] `pnpm build` 성공
- [ ] CouponPage: 사용 버튼 클릭 시 ConfirmModal 표시
- [ ] CouponPage: 확인 팝업 배경 클릭으로 닫힘
- [ ] CouponPage: "사용하기" 클릭 시 별 차감 동작
- [ ] CouponManagePage: 삭제 버튼 클릭 시 ConfirmModal 표시
- [ ] CouponManagePage: "삭제" 버튼 색상이 빨강(secondary) 계열
- [ ] 2곳 모두 `<ConfirmModal` 사용 확인 (grep)
- [ ] 원본 중복 팝업 코드 0곳 (grep "쿠폰을 사용할까요\|쿠폰을 삭제할까요" → ConfirmModal props만 남아야 함)

## 구현 노트 (Generator 작성)
- 상태: **완료**
- Sprint 1 후 줄 수: 2694 → Sprint 2 후: 2718 (+24줄)
  - ConfirmModal 컴포넌트 추가(+24줄) + 새 사용처(+20줄) - 원본 제거(-20줄) = 순증가
  - 줄 수 증가는 공용 추상화 도입 비용으로 정상 (향후 ConfirmModal 재사용 시 줄 감소)
- pnpm build: **성공** (dist/assets/index-BCX1X3zR.js, 435.57 kB)

### 교체 현황
| 컴포넌트 | 줄 | 교체 내용 |
|---------|-----|---------|
| CouponPage | 1165 | 사용 확인 팝업 → ConfirmModal (emoji 동적, confirmLabel="사용하기") |
| CouponManagePage | 1264 | 삭제 확인 팝업 → ConfirmModal (confirmColor=C.secondary, confirmLabel="삭제") |

### 통일화 적용
- maxWidth: 300 vs 320 → 320 통일
- padding: "28px→32px 24px 24px" 통일
- 타이틀 fontSize: 17→18 통일
- 이모지 fontSize: 40→48 통일

## 평가 결과
<!-- eval-02.md 참조 -->
- 상태: **PASS (99점)**
- 상세: `harness/evals/eval-02.md` 참조
