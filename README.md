# AtoJ - 무인교통단속장비 간이서버(아규격 → 자규격) 시스템 (v2.0.0)

- **적용 규격**: `경찰-6310-98-0001 (아 → 자)`
- **개발·기술지원**: ㈜이노네트웍스 강홍선 (`s_gain@naver.com`)

무인교통단속장비 **아규격(`경찰-6310-98-0001-아`)** 단속 데이터를 **자규격(`경찰-6310-98-0001-자`, `.DAT`)** 규격으로 실시간 변환하여 센터 단속처리 서버로 전달하고, 변환 이력·통계·내장 단속 영상을 **내장 데이터베이스(`SQLite WAL` 모드)** 기반으로 관리하는 Windows 10+ 전용 데스크톱 관제 애플리케이션입니다.

---

## 1. 배포 및 단독 실행 안내 (`AtoJ_Portable.exe`)

빌드 완료 후 `release/AtoJ_Portable.exe` **파일 1개만** 운영 서버나 원하는 폴더에 복사하여 바로 사용할 수 있습니다.
- 실행 파일 이름을 `AtoJ.exe` 등 원하는 이름으로 변경해도 정상 동작합니다.
- 최초 실행 시 실행 파일이 위치한 폴더를 기준으로 아래 파일과 폴더를 스스로 자동 생성합니다:
  - `config.json`: 환경 설정 파일 (`./result`, `./log` 상대경로 기본 적용)
  - `data/app.db`: 내장 데이터베이스 파일 (단속 변환 이력 및 통계 자동 저장)
  - `result/`: 변환된 자규격(`.DAT`) 파일 저장 폴더
  - `log/`: 일자별 상세 한글 로그(`observer_YYYYMMDD.log`, `watchdog_YYYYMMDD.log`) 기록 폴더

---

## 2. 빠른 시작 (소스코드 클론 및 `.exe` 빌드 명령어)

### 1) 저장소 복제 및 패키지 설치
```powershell
git clone https://github.com/garmoov-ux/atoj.git
cd atoj
npm install
```

### 2) 개발 모드 실행
```powershell
npm run dev
```

### 3) 타입 검사 및 단위 테스트 (Python 원본과 100% 바이트 일치 검증)
```powershell
npm run typecheck
npm test
```

### 4) Windows 배포용 실행 파일(`.exe`) 빌드
```powershell
# release/AtoJ_Portable.exe (단일 포터블) + release/AtoJ_Setup.exe (설치형) + release/win-unpacked 생성
npm run dist:win
```

---

## 3. 핵심 기능 및 개선 사항

1. **경찰규격서(아규격 → 자규격 `.DAT`) 100% 바이트 호환**
   - 아규격 선두 114바이트 헤더(`CP949` 차량번호, 장비번호, 차로, 위반시각, 번호판 좌표, 속도/신호위반 구분) 및 내장 JPEG 추출 후 Big-Endian 자규격 `.DAT`(`21_{장비번호}_{위반일시17자리}_0{차로}_0{위반코드}.DAT`)로 패킹합니다.
2. **비규격 파일 안전 처리 정책**
   - 아규격 파일명 정규식(`\d{16}\.[A-Z]\d{4}$`)과 일치하지 않는 파일 유입 시 **원본 보존(기본값) / 격리 폴더(`./quarantine`) 이동 / 즉시 삭제** 중 선택할 수 있습니다.
3. **고정 뷰포트(`1360 × 860`) 데스크톱 관제 UI & 오프라인 Pretendard 폰트**
   - 창 크기 조절로 인해 레이아웃이 깨지지 않도록 `1360 × 860` 고정 창 크기에 최적화되어 있으며, `Pretendard` 웹폰트가 앱 내부에 오프라인 내장되어 어떤 Windows PC에서도 선명한 가독성을 제공합니다.
   - **실시간 변환 내역** 및 **단속 변환 이력** 테이블의 모든 컬럼 헤더를 클릭하여 오름차순(`▲`) / 내림차순(`▼`) 정렬이 가능합니다.
4. **단속 파일(`.DAT` / 아규격) 내장 영상 확인 뷰어**
   - 별도 외부 뷰어 없이 `.DAT` 또는 아규격 원본 파일을 열어 차량 전체 영상, 번호판 인식 영상, 신호위반 연속 트래킹 영상(최대 8컷+) 및 헤더 상세 정보를 즉시 확인합니다.
5. **상세 한글 로깅 및 보관 기간 자동 정리**
   - 일자별 로그 파일에 `[감시엔진]`, `[변환처리]`, `[자동정리]` 구분자와 `[정보]`, `[주의]`, `[오류]` 등급으로 장비번호, 위반일시, 차량번호, 위반속도, 추출 영상 수, 파일 크기 및 오류 사유를 상세한 한글로 기록합니다.
   - 설정된 보관 기간(로그 파일, 변환 이력, 미수거 결과 파일, 격리 파일)이 지난 데이터는 매시간 자동으로 정리됩니다.
6. **작업표시줄 트레이 상주 및 안전 종료**
   - 창 닫기(`X`) 클릭 시 실수로 감시가 중단되지 않도록 작업표시줄 트레이로 숨겨지며, 트레이 아이콘 우클릭 메뉴의 **[프로그램 완전 종료]**로 안전하게 종료할 수 있습니다.

---

## 4. 설정 파일 (`config.json`) 규격

프로그램 폴더 내부 경로는 `./result`, `./log` 상대경로로 자동 인식되어 폴더 전체를 이동하더라도 설정 변경 없이 그대로 동작합니다.

```json
{
  "paths": {
    "sources": [
      "C:/save_std2",
      "D:/MuinServer/2_Metafile/Signal",
      "D:/MuinServer/2_Metafile/Speed"
    ],
    "targetDir": "./result",
    "logDir": "./log",
    "quarantineDir": "./quarantine"
  },
  "watcher": {
    "writeStabilitySec": 3,
    "scanExistingOnStart": true,
    "invalidFilePolicy": "ignore"
  },
  "retention": {
    "logDays": 30,
    "dbHistoryDays": 90,
    "resultDays": 0,
    "quarantineDays": 14
  },
  "system": {
    "minimizeToTrayOnClose": true
  }
}
```
