# AtoJ (아규격 → 자규격 실시간 변환 및 관제 데스크톱 앱)

무인교통단속장비 **아규격(`경찰-6310-98-0001-아`)** 단속 데이터를 **자규격(`경찰-6310-98-0001-자`, `.DAT`)** 규격으로 실시간 변환하여 센터 단속처리 서버로 전달하고, 변환 이력·통계·내장 영상을 **SQLite(`WAL` 모드)** 기반으로 관리하는 Windows 10+ 전용 Electron 애플리케이션입니다.

---

## 1. 빠른 시작 (클론 후 실행 및 `.exe` 빌드 명령어)

다른 PC에서 저장소를 내려받아 바로 실행하거나 설치/포터블 `.exe`를 만들 때 아래 명령어만 순서대로 실행하면 됩니다.

### 1) 저장소 복제 및 패키지 설치
```powershell
git clone https://github.com/garmoov-ux/atoj.git
cd atoj
npm install
```

### 2) 개발 모드 실행 (화면 실시간 확인)
```powershell
npm run dev
```

### 3) 테스트 및 코드 검증 (Python 원본과 100% 바이트 일치 검증)
```powershell
npm run typecheck
npm test
```

### 4) Windows 실행 파일(`.exe`) 빌드
```powershell
# 방법 A: 무설치 폴더형 실행파일 생성 (release/win-unpacked/AtoJ.exe)
npm run pack

# 방법 B: Windows 설치파일(Setup.exe) + 단일 포터블(Portable.exe) 동시 생성 (release/ 폴더)
npm run dist:win
```
> **참고**: `better-sqlite3` 네이티브 모듈 버전 충돌(`NODE_MODULE_VERSION`) 발생 시 `npm run rebuild:electron` 한 줄을 실행하면 즉시 해결됩니다.

---

## 2. 핵심 기능 및 기존 대비 개선 사항

1. **기존 Python(`muin.py`)과 100% 바이트 호환 보장**
   - 아규격 선두 114바이트 헤더(`CP949` 차량번호, 장비코드, 차로, 위반시각, 번호판 좌표, 과속/신호위반 구분) 및 내장 JPEG 추출 후 Big-Endian 자규격 `.DAT`(`21_{장비코드}_{위반일시17자리}_0{차로}_0{위반코드}.DAT`)로 패킹합니다.
2. **비규격 파일 무단 삭제 방지 (안전 정책 제공)**
   - 기존 `AtoJ.exe`는 정규식(`\d{16}\.[A-Z]\d{4}$`)에 맞지 않는 파일이 폴더에 들어오면 무조건 삭제했으나, 신규 버전은 **원본 보존(기본값) / 격리 폴더(`./quarantine`) 이동 / 즉시 삭제** 중 선택할 수 있습니다.
3. **미처리 잔여 파일 자동 스캔 및 비동기 큐**
   - 프로그램이 꺼져 있던 동안 수신 폴더에 쌓인 아규격 파일도 시작 시 자동 스캔하여 누락 없이 변환합니다.
4. **SQLite(`WAL` 모드) 변환 이력 및 통계 대시보드**
   - 변환 성공/실패 내역, 차량번호·장비코드·위반코드별 검색, 엑셀 호환 CSV(`UTF-8 BOM`) 내보내기를 지원합니다.
5. **단속 파일(`.DAT` / 아규격) 내장 정밀 뷰어**
   - 별도 외부 프로그램 없이 `.DAT` 또는 아규격 파일을 열어 차량 전체 영상, 번호판 영상, 신호위반 연속 트래킹 프레임(최대 8컷+)과 헤더 메타데이터를 즉시 검증합니다.

---

## 3. 설정 파일 (`config.json`) 규격

실행 파일과 같은 폴더의 `config.json`을 자동으로 읽고 저장하며, 기존 운영 서버의 `config.json`과 100% 호환됩니다.

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
  },
  "invalidFilePolicy": "ignore",
  "quarantineDir": "./quarantine",
  "scanExistingOnStart": true
}
```

---

## 4. 프로젝트 폴더 구조

```plaintext
AtoJ/
├── src/
│   ├── shared/               # 공통 도메인 타입, 경찰규격서 코드 라벨, IPC 채널 정의
│   ├── main/                 # Electron Main (config, SQLite DB, 아->자 변환기, chokidar 워처, IPC)
│   ├── preload/              # ContextBridge 보안 API (window.atojApi)
│   └── renderer/             # React 19 + Tailwind CSS v4 (DESIGN.md 기반 컴포넌트 모듈)
├── tests/                    # Python muin.py 100% 바이트 동등성 테스트 및 SQLite 단위 테스트
├── legacy_src/               # 기존 AtoJ.exe에서 역공학으로 복원한 원본 Python 코드 (app.py, muin.py)
├── DESIGN.md                 # UI/UX 디자인 시스템 명세
├── AGENTS.md                 # 에이전트 아키텍처 및 코딩 규칙
└── package.json              # 빌드 및 실행 스크립트
```
