# FamilyDay — 디자인 시스템

> Duolingo + Google Tasks를 결합한 느낌의 둥글고 부드러운 파스텔 톤 UI
> 아이 캐릭터, 세로형 타임라인, 별 보상 시스템, 쿠폰 교환 등 게이미피케이션 요소 활용

---

## 컬러 팔레트

| 역할 | 토큰명 | HEX |
|------|--------|-----|
| Primary (보라) | `C.primary` | `#6C63FF` |
| Primary Light | `C.primaryLight` | `#8B83FF` |
| Primary Dark | `C.primaryDark` | `#5549E8` |
| Secondary (코랄 핑크) | `C.secondary` | `#FF6584` |
| Secondary Light | `C.secondaryLight` | `#FF8DA4` |
| Accent (민트 그린) | `C.accent` | `#43D4A0` |
| Accent Light | `C.accentLight` | `#6EEDBE` |
| Gold (별/보상) | `C.gold` | `#FFD700` |
| Gold Light | `C.goldLight` | `#FFE44D` |
| Background | `C.bg` | `#F4F5FF` |
| Card | `C.card` | `#FFFFFF` |
| Text Dark | `C.textDark` | `#2D2B55` |
| Text Mid | `C.textMid` | `#6E6B99` |
| Text Light | `C.textLight` | `#A9A6C8` |
| Border | `C.border` | `#EEEDFC` |
| Mom Tag | `C.momTag` | `#FF6584` |
| Kid Tag | `C.kidTag` | `#6C63FF` |

---

## 타이포그래피

| 항목 | 스펙 |
|------|------|
| 폰트 | Nunito (Google Fonts, 동적 `<link>` 로드) |
| 굵기 | 400, 600, 700, 800, 900 |
| 헤딩 | 18-22px, fontWeight 900 |
| 본문 | 14-15px, fontWeight 600 |
| 캡션 | 11-13px, fontWeight 700 |

---

## 라운딩 & 그림자

| 요소 | borderRadius | boxShadow |
|------|-------------|-----------|
| 카드 | `20px` | `0 4px 20px rgba(108,99,255,.08)` |
| 버튼/뱃지 | `999px` (pill) | — |
| 모달 | `28px 28px 0 0` | — |
| 확인 팝업 | `24px` | — |
| 이모지 아이콘 박스 | `14px` | — |

---

## 타임라인 디자인

| 항목 | 스펙 |
|------|------|
| 레이아웃 | 세로형 중앙 스파인 + 좌우 교차 배치 |
| 스파인 | 5px 너비, 세그먼트별 그라데이션 색상 전환, 하단 화살표 |
| 세그먼트 색상 | `C.secondary`, `C.primary`, `C.accent`, `C.gold`, `C.primaryLight`, `C.accentLight` 순환 |
| 노드 원 | 완료: 세그먼트 색상 그라데이션, 진행중: primary 그라데이션 + 글로우링, 미래: 연회색 |
| 노드 크기 | 진행중 40px, 기본 32px, 3px 흰색 테두리 |
| 시간 리본 | 그라데이션 배경, 흰색 텍스트, borderRadius 10px |
| 콘텐츠 카드 | 시간 리본 반대편에 배치, borderRadius 16px |
| 진행중 캐릭터 | `CuteFace` 프로필 아바타 (32px) + "지금!" 말풍선, float 애니메이션 |

---

## 쿠폰 디자인

| 항목 | 스펙 |
|------|------|
| 쿠폰 카드 | 흰색 배경, borderRadius 20px, 이모지 아이콘(48px, 14px radius) + 정보 + 액션 버튼 |
| 이모지 아이콘 박스 | `linear-gradient(135deg, #FFF9E0, #FFF3CC)` 배경 |
| 별 비용 표시 | ★ + 숫자, `#D4A017` 색상, fontWeight 900 |
| 교환 버튼 | pill shape, accent 그라데이션 (활성) / border 색상 (비활성) |
| 사용 완료 뱃지 | `accent` 색상 텍스트 + 테두리, 카드 opacity 0.6 |
| 확인 팝업 | 중앙 모달, 이모지 48px, pop 애니메이션, 취소/확인 2버튼 |
| 쿠폰 추가 모달 | 바텀시트, 이모지 그리드(40px 버튼), 별 갯수 입력, 미리보기 |

---

## 애니메이션 (키프레임)

모든 키프레임은 `<style id="fd-kf">` 태그로 동적 주입됩니다.

| 이름 | 용도 |
|------|------|
| `starFly` | 별 완료 시 날아가는 효과 |
| `confetti` | 컨페티 파티클 |
| `pop` | 스케일 바운스 (확인 팝업 등) |
| `slideUp` | 카드/모달 등장 |
| `slideLeft` / `slideRight` | 캘린더 주/월 전환 |
| `fadeIn` | 오버레이 등장 |
| `checkPop` | 체크마크 등장 |
| `strikethrough` | 취소선 효과 |
| `pulseGlow` | 플로팅 버튼 글로우 |
| `glowRing` | 완료 노드 글로우 링 |
| `glowRingCurrent` | 진행중 노드 글로우 링 |
| `float` | 캐릭터/아바타 떠다니기 |
| `shimmer` | 프로그레스 바 빛남 |
| `dashDraw` | SVG 대시 드로잉 |

---

## 스타일링 규칙

- CSS-in-JS 인라인 스타일만 사용 (별도 CSS 파일 금지)
- 색상은 반드시 `C` 토큰 객체 사용 (하드코딩 HEX 금지)
- 새 키프레임 애니메이션은 `<style id="fd-kf">` 블록에 추가
- React Fragment (`<>...</>`) 대신 `<div>` 사용
- 모든 UI 텍스트는 한국어
- 아이 이름은 하드코딩하지 않고 `kidName` 동적 변수 사용
