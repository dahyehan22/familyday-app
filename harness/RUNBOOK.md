# 하네스 실행 가이드 (Runbook)

## 에이전트별 실행 프롬프트

---

### Planner Agent (최초 1회)
이미 완료됨. 출력물: `specs/refactor-spec.md`, `artifacts/baseline-snapshot.txt`

---

### Generator Agent 실행 방법

새 대화(컨텍스트 리셋)를 시작하고 아래 프롬프트를 그대로 전달:

```
FamilyDay 리팩토링 Generator입니다.

읽어야 할 파일:
1. harness/specs/refactor-spec.md  ← 전체 명세 및 제약 조건
2. harness/sprints/sprint-01.md    ← 이번 스프린트 계약
3. harness/artifacts/baseline-snapshot.txt  ← 현재 코드 기준선
4. src/FamilyDay.jsx               ← 실제 구현 대상

위 파일들을 읽고 sprint-01.md의 "구현 범위"를 구현하세요.
구현 완료 후 sprint-01.md의 "구현 노트" 섹션을 업데이트하세요.

절대 지켜야 할 규칙:
- pnpm build가 통과해야 함
- CLAUDE.md 제약 위반 금지
- 명세에 없는 추가 변경 금지
```

---

### Evaluator Agent 실행 방법

Generator 완료 후 새 대화(컨텍스트 리셋)를 시작하고 아래 프롬프트 전달:

```
FamilyDay 리팩토링 Evaluator입니다.

읽어야 할 파일:
1. harness/sprints/sprint-01.md    ← 이번 스프린트 성공 기준
2. harness/evals/eval-template.md  ← 채점 템플릿
3. src/FamilyDay.jsx               ← 변경된 코드

평가 절차:
1. pnpm build 실행
2. sprint-01.md의 "성공 기준 체크리스트" 항목 순서대로 정적 검증
3. eval-template.md 형식으로 harness/evals/eval-01.md 작성
4. 80점 미만이면 구체적 수정 지시 포함

주의: 당신은 평가만 합니다. 코드를 직접 수정하지 마세요.
```

---

## 스프린트 진행 흐름

```
[시작]
  ↓
Generator가 sprint-N.md 읽고 구현
  ↓
pnpm build 확인
  ↓
Evaluator가 eval-N.md 작성 (점수 산정)
  ↓
80점 이상? → sprint-(N+1).md 진행
80점 미만? → Generator에 eval-N.md 피드백 전달 → 재구현
```

## 현재 스프린트 상태

| 스프린트 | 내용 | 상태 |
|----------|------|------|
| Sprint 1 | BottomSheet 추출 | **PASS (96점)** |
| Sprint 2 | ConfirmModal 추출 | **PASS (99점)** |
| Sprint 3 | 공용 스타일 상수 | **PASS (99점)** |
| Sprint 4 | Supabase 서비스 레이어 | **PASS (99점)** |
| Sprint 5 | useTodoManager 훅 | **PASS (99점)** |
| Sprint 6 | useCouponManager + useEventManager 훅 | **PASS (100점)** |

## 중단/재개 방법

- 언제든 중단 가능. 마지막으로 PASS된 스프린트 번호를 확인하고 다음 스프린트부터 재개.
- 각 파일이 상태를 보존하므로 대화 컨텍스트 없어도 재개 가능 (하네스의 핵심).
