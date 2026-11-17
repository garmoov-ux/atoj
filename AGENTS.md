# AtoJ 프로젝트 작업 및 코딩 아키텍처 표준 규칙 (AGENTS.md)

본 문서는 `AtoJ` 워크스페이스의 마스터 지침서이며, 세부 분야별 규칙은 `.agents/rules/` 하위 6개 규칙 파일과 `DESIGN.md`를 따른다.

## 0. 세부 규칙 파일 참조 체계 (`.agents/rules/`)
1. **`architecture-and-spec.md`**: 경찰규격서(`아` -> `자`) 114B 헤더 파싱, JPEG 추출, Big-Endian `.DAT` 바이너리 패킹 명세
2. **`codebase-and-components.md`**: 1파일 1컴포넌트/1모듈 원칙, 파일/함수 줄 수 제한, `main` / `preload` / `renderer` / `shared` 폴더 아키텍처
3. **`design-system.md`**: `DESIGN.md`(Apple Design System) 기반 컬러(`#0066cc`, `#f5f5f7`, `#1d1d1f`, `#272729`), 18px 카드, Pill 버튼, 무그라데이션/헤어라인 보더 규칙
4. **`security-and-env.md`**: `.env` / `.env.example` 환경변수 분리, Electron `contextIsolation: true`, SQLite Prepared Statement 및 `WAL` 모드 보안 규칙
5. **`testing-and-verification.md`**: 기존 Python `muin.py`와의 바이트 단위 100% 동등성(Byte-for-byte parity) Vitest 단위 테스트, 인메모리 SQLite 테스트, 빌드 검증 절차
6. **`git-workflow.md`**: `<type>(<scope>): <한글 커밋 요약>` 커밋 컨벤션 및 저장소 보안 규칙

## 1. 언어 및 커뮤니케이션 스타일
- 모든 설명, 코드 주석, 보고서(Artifact), 커밋 메시지 요약은 한국어로 작성한다.
- 문서와 코드 주석에는 이모지(Emoji)를 사용하지 않는다.
- 불필요한 서론을 줄이고 핵심 결론과 실행 가능한 코드/결과물 위주로 간결하게 답변한다.
- 요구사항이 모호할 때는 임의로 추측해서 크게 수정하지 말고 먼저 질문한다.

## 2. 도메인 핵심 원칙 (아규격 -> 자규격 변환 무결성)
- 운영 서버의 무인교통단속장비 **아규격(`경찰-6310-98-0001-아`)** 단속 파일을 **자규격(`경찰-6310-98-0001-자`, `.DAT`)** 파일로 변환할 때, 출력 바이트열은 기존 단속처리 시스템과 100% 호환되어야 한다.
- 비규격 파일이 감시 폴더에 유입되었을 때 원본 파일을 무조건 삭제하지 않도록 안전 정책(`ignore` / `quarantine` / `delete`)을 지원한다.

## 3. 컴포넌트 및 모듈 단위 개발 원칙
- 코드가 짧더라도 한 파일에 여러 컴포넌트나 비즈니스 로직을 몰아넣지 않고, 처음부터 재사용 가능한 원자적 UI 컴포넌트(`components/ui/`), 레이아웃(`components/layout/`), 도메인 기능(`features/`), 백엔드 서비스(`converter/`, `watcher/`, `db/`, `config/`)로 모듈화하여 개발한다.
- UI 컴포넌트(`.tsx`) 및 서비스 모듈(`.ts`)은 권장 200행(최대 300행) 이내, 단일 함수는 권장 40행(최대 80행) 이내로 유지한다.
