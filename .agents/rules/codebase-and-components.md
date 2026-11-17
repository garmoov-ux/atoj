---
trigger: always_on
---

# 코드베이스 구조 및 컴포넌트 모듈화 규칙

## 1. 1파일 1책임 (Single Responsibility) 및 모듈 단위 개발 원칙
코드가 짧더라도 한 파일에 여러 컴포넌트나 비즈니스 로직을 몰아넣지 않고, 처음부터 역할별로 명확히 분리된 모듈/컴포넌트 단위로 개발한다.

### 파일 및 함수 크기 제한
- **UI 컴포넌트 (`.tsx`)**: 권장 200행 이내 (최대 300행 초과 금지 -> 하위 프레젠테이션 컴포넌트 및 커스텀 훅으로 분리)
- **비즈니스/서비스 모듈 (`.ts`)**: 권장 200행 이내 (최대 300행 초과 금지 -> 파서, 패커, 워처, 리포지토리로 분리)
- **단일 함수 본문**: 권장 40행 이내 (최대 80행 초과 금지)

## 2. 표준 디렉터리 및 모듈 아키텍처

```plaintext
src/
├── shared/                       # Main과 Renderer가 공유하는 순수 타입, 상수, IPC 채널 규격
│   ├── types/                    # 도메인 모델(단속기록, 헤더 구조, 설정, 통계 타입)
│   └── ipc-channels.ts           # 타입 안전한 IPC 채널명 및 페이로드 매핑
├── main/                         # Electron Main 프로세스 (Node.js 환경)
│   ├── index.ts                  # 앱 생명주기, 단일 인스턴스 락, 창/트레이 초기화
│   ├── config/                   # .env 환경변수 및 config.json 로드/검증/저장 모듈
│   ├── db/                       # SQLite(better-sqlite3) 초기화, 마이그레이션, DAO/Repository
│   │   ├── connection.ts         # WAL 모드, pragma 설정, DB 연결 싱글톤
│   │   ├── schema.ts             # 테이블 및 인덱스 DDL 정의
│   │   └── conversion-repo.ts    # 변환 이력 적재, 검색, 통계 집계 쿼리 모듈
│   ├── converter/                # 아규격 -> 자규격(.DAT) 바이너리 변환 엔진
│   │   ├── aver-parser.ts        # 아규격 114B 헤더(CP949) 및 JPEG(SOI~EOI/7B 길이) 추출
│   │   ├── jver-packer.ts        # 자규격 Big-Endian 바이너리 패킹 및 .DAT 생성
│   │   └── dat-reader.ts         # 생성된 .DAT 파일 역파싱 및 뷰어용 미리보기 추출
│   ├── watcher/                  # 다중 폴더 감시 및 비동기 변환 큐
│   │   ├── folder-watcher.ts     # chokidar 기반 실시간 감시 및 초기 미처리 파일 스캔
│   │   └── conversion-queue.ts   # 동시성 제어, 재시도, 비규격 파일 안전 처리 큐
│   └── ipc/                      # 도메인별 IPC 핸들러 등록
├── preload/                      # ContextBridge 보안 브릿지
│   └── index.ts                  # window.atojApi 노출
└── renderer/                     # React 19 + Tailwind CSS v4 프론트엔드
    ├── components/
    │   ├── ui/                   # 원자적 공통 UI (PillButton, UtilityCard, OptionChip, SearchInput, Badge)
    │   └── layout/               # GlobalNav, FrostedSubNav, StatusFooter
    ├── features/
    │   ├── dashboard/            # 실시간 감시 상태, KPI 타일, 실시간 변환 스트림 목록
    │   ├── history/              # SQLite 이력 검색, 필터 칩, 상세 모달, CSV/XLSX 내보내기
    │   ├── viewer/               # .DAT / 아규격 파일 드래그앤드롭 분석 및 차량/번호판/트래킹 이미지 뷰어
    │   └── settings/             # 감시 폴더 목록, 타겟/로그 경로, 대기시간(sleep), 비규격 파일 정책 설정
    ├── hooks/                    # IPC 구독, 상태 폴링, 필터 상태 관리 커스텀 훅
    └── styles/                   # DESIGN.md 토큰 기반 글로벌 스타일
```
