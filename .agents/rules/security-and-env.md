---
trigger: always_on
---

# 보안, Electron 프로세스 격리, SQLite 및 환경변수(.env) 규칙

## 1. 환경변수 (`.env` / `.env.example`) 관리 규칙
- 환경별 설정값(DB 저장 경로, 로그 보관 기간, 디버그 레벨, 기본 설정 파일 경로 등)은 `.env` 파일을 통해 주입할 수 있도록 구성한다.
- `.env` 파일은 절대 Git에 커밋하지 않으며(`.gitignore` 등록), 모든 환경변수 키와 기본값 설명이 담긴 `.env.example` 파일을 저장소 루트에 유지한다.
- Renderer(프론트엔드) 프로세스에는 `process.env`를 직접 노출하지 않으며, 허용된 설정값만 Main 프로세스에서 검증 후 IPC를 통해 전달한다.

## 2. Electron 보안 아키텍처 규칙
- `BrowserWindow` 생성 시 다음 보안 옵션을 반드시 강제한다:
  - `contextIsolation: true`
  - `nodeIntegration: false`
  - `sandbox: true` (또는 Preload 브릿지 최소 권한)
  - `webSecurity: true`
- Renderer에서 Main의 기능을 호출할 때는 반드시 `preload/index.ts`의 `contextBridge.exposeInMainWorld('atojApi', ...)`에 정의된 명시적 함수만 사용한다 (`ipcRenderer` 원본 객체 노출 금지).
- 파일 열기/변환/삭제 등 파일시스템 접근 시 경로 조작(Path Traversal)을 방지하기 위해 Main 프로세스에서 `path.resolve` 및 허용 경로 검증을 수행한다.

## 3. SQLite (`better-sqlite3`) 보안 및 무결성 규칙
- **SQL Injection 원천 차단**: 모든 SQL 쿼리는 100% Prepared Statement 및 바인딩 파라미터(`?` 또는 `@param`)만 사용한다. 사용자 입력(차량번호 검색어, 장비코드 등)을 문자열 템플릿 리터럴로 SQL에 직접 결합하는 것을 절대 금지한다.
- **WAL 모드 및 동시성 설정**: DB 연결 즉시 아래 Pragma를 실행한다:
  - `PRAGMA journal_mode = WAL;`
  - `PRAGMA synchronous = NORMAL;`
  - `PRAGMA foreign_keys = ON;`
  - `PRAGMA busy_timeout = 5000;`
- 대량 파일 일괄 스캔 및 적재 시에는 `db.transaction(...)`으로 묶어 원자성(Atomicity)과 디스크 I/O 성능을 보장한다.
