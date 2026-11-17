---
trigger: always_on
---

# UI/UX 디자인 시스템 규칙 (DESIGN.md 준수)

프론트엔드(`src/renderer/`)의 모든 화면과 컴포넌트는 프로젝트 루트의 `DESIGN.md`에 정의된 디자인 철학과 토큰을 엄격히 준수한다.

## 1. 컬러 시스템 (Colors)
- **단일 브랜드 액센트 (Single Accent)**:
  - Action Blue (`#0066cc`): 모든 주요 버튼(Primary Pill CTA), 활성 탭, 링크, 핵심 상태 강조에 사용하는 유일한 브랜드 컬러
  - Focus Blue (`#0071e3`): 키보드 포커스 링 (`outline: 2px solid #0071e3`)
  - Sky Link Blue (`#2997ff`): 다크 타일(`#272729`) 위에서만 사용하는 텍스트/수치 강조 블루
- **배경 및 표면 (Surfaces)**:
  - Pure White (`#ffffff`): 기본 유틸리티 카드, 테이블 컨테이너, 입력창 배경
  - Parchment (`#f5f5f7`): 앱 기본 캔버스 배경 및 교차 섹션 배경 (화이트 카드와의 미세한 명도 차이로 영역 구분)
  - Pearl Button (`#fafafc`): 보조 캡슐 버튼 배경
  - Near-Black Tile (`#272729` / `#2a2a2c` / `#252527`): 핵심 요약 히어로 타일 및 단속 영상 뷰어 다크 캔버스
  - Pure Black (`#000000`): 최상단 슬림 글로벌 네비게이션 바(`height: 44px`) 및 원본 영상 프레임 배경
- **텍스트 및 보더 (Text & Hairlines)**:
  - Near-Black Ink (`#1d1d1f`): 기본 헤드라인 및 본문 텍스트 (순수 검정 대신 사용)
  - Muted Text (`#7a7a7a` / 다크 위 `#cccccc`): 캡션, 타임스탬프, 부가 설명
  - Hairline Border (`#e0e0e0` 또는 `rgba(0, 0, 0, 0.08)`): 유틸리티 카드의 1px 실선 테두리

## 2. 타이포그래피 및 간격 (Typography & Layout)
- **폰트 스택**: `SF Pro Display, SF Pro Text, -apple-system, BlinkMacSystemFont, 'Inter', 'Pretendard', system-ui, sans-serif`
- **웨이트(Weight) 규칙**: `300` / `400`(본문) / `600`(헤드라인 및 강조) / `700`만 사용하며 어중간한 `500` 웨이트는 지양한다. 헤드라인에는 미세한 음수 자간(`-0.015em` ~ `-0.02em`)을 적용한다.
- **8px 베이스 그리드**: 카드 패딩은 `24px`(`p-6`), 카드 간격은 `20~24px`(`gap-5` ~ `gap-6`)을 기본으로 하여 여백의 미(Whitespace pedestal)를 살린다.

## 3. 형태, 그림자 및 인터랙션 (Shapes, Elevation & Micro-interactions)
- **무그라데이션 & 절제된 그림자 원칙**:
  - 배경이나 버튼에 장식용 CSS 그라데이션을 절대 사용하지 않는다.
  - 일반 UI 카드나 버튼에는 그림자(Drop Shadow)를 넣지 않고 `1px solid #e0e0e0` 헤어라인 보더와 표면 색상 대비(`#f5f5f7` 캔버스 위 `#ffffff` 카드)만으로 계층을 표현한다.
  - 유일한 드롭 섀도(`0 5px 30px rgba(0, 0, 0, 0.22)`)는 뷰어에서 **단속 차량/번호판 사진 이미지**가 표면에 놓일 때만 적용한다.
- **보더 라디우스 규격 (Radius Grammar)**:
  - 유틸리티 카드 컨테이너: `18px` (`rounded-[18px]`)
  - 보조 Pearl 캡슐 버튼: `11px` (`rounded-[11px]`)
  - 다크 유틸리티 버튼 및 카드 내부 썸네일 이미지: `8px` (`rounded-[8px]`)
  - 주요 액션 버튼(Primary/Secondary Pill CTA), 필터 선택 칩, 검색 입력창: `9999px` (`rounded-full`)
- **마이크로 인터랙션**:
  - 모든 버튼은 클릭/활성 상태(Active)에서 `transform: scale(0.95)` (`active:scale-95 transition-transform duration-150`)를 적용한다.
  - 상단 서브 네비게이션(`sub-nav-frosted`, 높이 `52px`)과 하단 플로팅 바는 `rgba(245, 245, 247, 0.8)` 배경에 `backdrop-filter: saturate(180%) blur(20px)` 프로스티드 글래스 효과를 적용한다.
