# FamilyDay 하네스 엔지니어링

## 구조

```
harness/
├── README.md          ← 이 파일 (하네스 사용법)
├── specs/
│   └── refactor-spec.md   ← Planner 출력: 전체 리팩토링 명세
├── sprints/
│   ├── sprint-01.md       ← 스프린트 계약 (Generator ↔ Evaluator 합의)
│   ├── sprint-02.md
│   └── ...
├── evals/
│   ├── eval-01.md         ← Evaluator 채점 결과
│   ├── eval-02.md
│   └── ...
└── artifacts/
    └── baseline-snapshot.txt  ← 리팩토링 전 기준선 (줄 수, 구조 등)
```

## 에이전트 역할

### Planner Agent
- 현재 코드를 분석하고 `specs/refactor-spec.md` 작성
- 스프린트 순서와 의존성 정의
- 각 스프린트의 성공 기준 초안 작성

### Generator Agent
- `specs/refactor-spec.md`와 해당 `sprints/sprint-N.md`를 읽고 구현
- 구현 완료 후 `sprints/sprint-N.md`에 구현 노트 추가
- CLAUDE.md 제약 (단일 파일, CSS-in-JS, 한국어 UI) 반드시 준수

### Evaluator Agent
- `pnpm build`로 빌드 검증
- 기능 체크리스트 항목 직접 확인
- `evals/eval-N.md`에 채점 결과 기록
- Pass/Fail + 구체적 수정 지시 반환

## 실행 원칙

1. **컨텍스트 리셋**: 스프린트 간 에이전트는 파일에서만 상태를 읽음 (대화 히스토리 의존 금지)
2. **스프린트 계약**: Generator가 구현 전에 Evaluator와 성공 기준 합의
3. **점진적 진행**: 한 번에 하나의 스프린트만, 평가 통과 후 다음으로
4. **빌드 우선**: 어떤 리팩토링도 `pnpm build` 실패 허용 안 함
