# AtoJ (아규격 -> 자규격 실시간 변환 및 관제 데스크톱 앱)

무인교통단속장비 **아규격(`경찰-6310-98-0001-아`)** 단속 데이터를 **자규격(`경찰-6310-98-0001-자`, `.DAT`)** 규격으로 실시간 변환하여 센터 단속처리 서버로 전달하고, 변환 이력·통계·영상 미리보기를 SQLite 기반으로 관리하는 Windows 10+ 전용 Electron 데스크톱 애플리케이션입니다.

---

## 1. 주요 기능

1. **다중 소스 폴더 실시간 감시 및 미처리 파일 자동 스캔**
   - `config.json` 및 앱 설정에 등록된 복수의 수신 폴더(예: `C:/save_std2`, `D:/MuinServer/2_Metafile/Signal`, `D:/MuinServer/2_Metafile/Speed`)를 실시간 감시합니다.
   - 프로그램 시작 시 감시 폴더 내에 이미 쌓여 있던 미처리 아규격 파일도 자동으로 스캔하여 순차 변환합니다.
   - 파일 쓰기 완료 대기(Stability Delay) 및 비동기 작업 큐를 통해 대량 파일 동시 유입 시에도 누락 없이 처리합니다.
2. **아규격 -> 자규격(`.DAT`) 무결성 바이너리 변환**
   - 선두 114바이트 헤더 파싱 (`CP949` 차량번호, 장비코드, 차로, 위반시각, 번호판 좌표, 과속/신호위반 구분 등)
   - 내부 JPEG 이미지(차량 전체, 번호판, 신호위반 트래킹 프레임) 추출
   - 경찰청 자규격 Big-Endian 바이너리 패킹(`21_{장비코드}_{위반일시17자리}_0{차로}_0{위반코드}.DAT`)
   - 비규격 파일 유입 시 무단 삭제 방지 옵션 제공 (무시 / 별도 격리 폴더 이동 / 삭제 중 선택)
3. **SQLite(`WAL` 모드) 기반 변환 이력 및 통계 관리**
   - 변환 성공/실패 이력, 장비코드별·일자별·위반코드별(과속/신호) 통계 자동 적재
   - 차량번호, 장비코드, 날짜 범위, 상태별 초고속 검색 및 CSV/XLSX 내보내기
4. **단속 파일(`.DAT` / 아규격) 내장 뷰어**
   - 변환된 `.DAT` 파일 또는 원본 아규격 파일의 헤더 메타데이터와 내장 JPEG 이미지(차량/번호판/트래킹 프레임)를 앱 화면에서 즉시 열람

---

## 2. 기술 스택

- **Desktop Shell**: Electron (Windows 10+ 64-bit, System Tray 상주 및 자동 시작 지원)
- **Frontend UI**: React 19 + TypeScript + Tailwind CSS v4
- **Database**: SQLite3 (`better-sqlite3`, WAL 모드)
- **Binary & Encoding**: Node.js `Buffer` (Big-Endian 패킹) + `iconv-lite` (`CP949` 완벽 호환)
- **File Watcher**: `chokidar` (파일 쓰기 완료 감지 `awaitWriteFinish` 지원)

---

## 3. 디렉터리 구조

```plaintext
AtoJ/
├── .agents/                  # Antigravity 에이전트 규칙(rules), 스킬(skills), 로컬 MCP 설정
├── legacy_src/               # 기존 PyInstaller 실행 파일(AtoJ.exe)에서 복원한 원본 Python 코드
│   ├── app.py                # 기존 Watchdog 폴더 감시 스크립트
│   └── muin.py               # 기존 아규격 -> 자규격 바이너리 변환 모듈
├── src/
│   ├── main/                 # Electron Main 프로세스 (감시 엔진, 바이너리 변환기, SQLite DB, IPC)
│   ├── preload/              # ContextBridge 기반 안전한 IPC 브릿지
│   └── renderer/             # React + Tailwind CSS 대시보드, 이력 조회, 파일 뷰어, 설정 UI
├── config.json               # 기본 경로 호환용 설정 파일
├── AGENTS.md                 # 에이전트 상시 준수 아키텍처 및 코딩 규칙
└── README.md                 # 프로젝트 문서
```

---

## 4. 설정 파일 (`config.json`) 호환 규격

기존 운영 서버의 `config.json` 설정을 그대로 읽어들여 하위 호환성을 유지합니다.

```json
{
  "path": {
    "source": [
      "C:/save_std2",
      "D:/MuinServer/2_Metafile/Signal",
      "D:/MuinServer/2_Metafile/Speed"
    ],
    "target": "./result",
    "log": "./log",
    "sleep": 3
  }
}
```
