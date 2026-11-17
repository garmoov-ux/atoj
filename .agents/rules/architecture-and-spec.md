---
trigger: always_on
---

# AtoJ 아키텍처 및 경찰규격서(아규격 -> 자규격) 변환 명세 규칙

본 규칙은 `_규격서/무인교통단속장비 경찰규격서(경찰-6310-98-0001-아).pdf` (p.50~51, 표41) 및 `무인교통단속장비 경찰규격서(경찰-6310-98-0001-자).pdf` (p.27~29, 표36~38)와 기존 `legacy_src/muin.py` 운영 로직을 기준으로 정의한다.

## 1. 아규격(`경찰-6310-98-0001-아`) 입력 파일 규격
1. **파일명 정규식**: `\d{16}\.[A-Z]\d{4}$`
2. **TEXT부 헤더 구조 (선두 114 Bytes, ASCII / CP949)**:
   - 구조체 포맷: `7s 5s 3s 1s 1s 8s 6s 12s 4s 4s 4s 4s 1s 1s 1s 23s 23s 2s 1s 1s 1s 1s` (합계 114B)
   - `[0] device_type (SIZE)` (`7B`): TEXT부 사이즈 (예: `0000106`)
   - `[1] device_code (LocalNo)` (`5B`): 지역제어장치번호/장비코드 (예: `F9999`, `M9999`)
   - `[2] enf_speed (AAA)` (`3B`): 위반속도 km/h (예: `095`)
   - `[3] car_type (B)` (`1B`): 위반차량 차종 (`1`:승용차, `2`:버스/승합, `3`:대형화물차, `4`:소형화물차, `5`:특수차, `6`:알수없음)
   - `[4] lane (C)` (`1B`): 위반차로 (`1`:1차로, `2`:2차로 ...)
   - `[5] enf_date (DDDDDDDD)` (`8B`): 위반날짜 (`YYYYMMDD`)
   - `[6] enf_time (EEEEEE)` (`6B`): 위반시간 (`HHMMSS`)
   - `[7] car_num (FFFFFFFFFFFF)` (`12B`): 위반차량번호 (`CP949`, 미인식 시 `XXXXXXXXXXXX`)
   - `[8] car_num_x_start (GGGG)` (`4B`): 번호판 시작 X위치
   - `[9] car_num_y_start (HHHH)` (`4B`): 번호판 시작 Y위치
   - `[10] car_num_width (IIII)` (`4B`): 번호판 WIDTH
   - `[11] car_num_height (JJJJ)` (`4B`): 번호판 HEIGHT
   - `[12] use_car_num (K)` (`1B`): 번호판 유/무 (`1`:존재, `0`:미존재)
   - `[13] enf_code (L)` (`1B`): 위반코드 (`1`:속도위반, `2`:버스전용, `3`:신호/속도위반, `4`:갓길, `5`:신호위반, `6`:단속안함, `7`:꼬리물기) — 기존 운영 서버 기준 `'1'`=속도위반, `'3'`=신호위반
   - `[14] enf_type (M)` (`1B`): 세부 위반종류 (`1`:지점과속/신호위반, `2`:구간과속/차로위반)
   - `[15] signal_start_pass_time (N)` (`23B`): 정지선 통과시간 (`YYYY-MM-DD HH:mm:ss:nnn` 또는 초 단위 실수 문자열)
   - `[16] signal_end_pass_time (O)` (`23B`): 교차로 통과시간 (`YYYY-MM-DD HH:mm:ss:ooo` 또는 초 단위 실수 문자열)
   - `[17] tracking_frame (PP)` (`2B`): 연속영상 프레임 수 (예: `08`)
   - `[18] signal_shape (Q)` (`1B`): 신호등 상태/형태 (`1`:녹색, `2`:황색, `3`:좌회전, `4`:우회전, `5`:적색, `6`:직좌동시, `7`:점멸, `8`:소등, `9`:고장)
   - `[19] car_direction (R)` (`1B`): 차량진행형태 (`1`:직진, `2`:좌회전, `3`:우회전, `4`:정지)
   - `[20] signal_type (S)` (`1B`): 신호등 종류 (`1`:3색등[적황좌], `2`:3색등[적황직], `3`:4색등[적황좌직], `4`:5색등[적황좌직우])
   - `[21] trigger_type (X)` (`1B`): 트리거 종류 (`0`:위반, `1`:Soft, `2`:One Trigger)
3. **IMAGE부 추출**:
   - 114B 이후 영역에서 JPEG 이미지(`0xFF 0xD8` ~ `0xFF 0xD9`)를 추출한다 (7B 사이즈 헤더 `TTTTTTT`/`UUUUUUU`/`VVVVVVV` 검증 및 SOI/EOI 추출 호환).
   - `image_data[0]`: 차량 전체 이미지 (`car_c_image`)
   - `image_data[1]`: 번호판 이미지 (`car_l_image`)
   - `image_data[2:]`: 신호위반(`enf_code == '3'`) 시 연속(트래킹) 이미지들

## 2. 자규격(`경찰-6310-98-0001-자`, `.DAT`) 출력 파일 규격
1. **출력 파일명**:
   - `21_{device_code}_{enf_date}{enf_time}000_0{lane}_0{device_type}.DAT`
2. **바이너리 패킹 구조 (Big-Endian 기준)**:
   - `위반코드` (`1B int8`): `1`(속도위반) 또는 `3`(신호위반)
   - `파일버전` (`2B`): `0x00 0x00`
   - `차량종류` (`1B int8`): `int(car_type)`
   - `차량번호` (`20B`): `CP949` 디코딩 후 `strip()` -> 다시 `CP949` 인코딩 후 `0x00`으로 20바이트 우측 패딩(`ljust(20, b'\x00')`)
   - `위반차로` (`1B int8`): `int(lane)`
   - `위반시각` (`17B ASCII`): `{enf_date}{enf_time}000` (`YYYYMMDDHH24MISSFF3`)
   - `번호판유무` (`1B int8`): `int(use_car_num)`
   - `번호판X위치` (`2B >h`), `번호판Y위치` (`2B >h`), `번호판WIDTH` (`2B >h`), `번호판HEIGHT` (`2B >h`)
   - **속도위반(`enf_code == '1'`) 분기**:
     - `단속속도` (`2B >h`): `int(enf_speed)`
     - `위반속도` (`2B >h`): `int(enf_speed)`
   - **신호위반(`enf_code == '3'`) 분기**:
     - `위반속도` (`2B >h`): `int(enf_speed)`
     - `정지선통과시간` (`8B >d` IEEE 754 Double): `float(signal_start_pass_time)`
     - `교차로통과시간` (`8B >d` IEEE 754 Double): `float(signal_end_pass_time)`
     - `신호등형태` (`1B int8`): `int(signal_shape)`
     - `차량진행형태` (`1B int8`): `int(car_direction)`
     - `신호등종류` (`1B int8`): `int(signal_type)`
   - **차량 이미지 블록**:
     - `차량영상종류` (`1B`): `'J'`
     - `차량파일명칭` (`50B`): `F21_{device_code}_{date_time_enf}_0{lane}_J_C_XX_JPG` (`0x00` 50바이트 우측 패딩)
     - `차량파일크기` (`4B >I` uint32): `len(car_c_image)`
     - `차량파일정보` (`NB`): `car_c_image` 바이트
   - **번호판 이미지 블록**:
     - `번호판영상종류` (`1B`): `'J'`
     - `번호판파일명칭` (`50B`): `F21_{device_code}_{date_time_enf}_0{lane}_J_L_XX_JPG` (`0x00` 50바이트 우측 패딩)
     - `번호판파일크기` (`4B >I` uint32): `len(car_l_image)`
     - `번호판파일정보` (`NB`): `car_l_image` 바이트
   - **트래킹 이미지 블록 (`enf_code == '3'`일 때만)**:
     - `프레임수` (`1B int8`): `int(tracking_frame)`
     - `image_data[2:]` 각 프레임 `i` (`0, 1, ...`) 반복:
       - `트래킹영상종류{i}` (`1B`): `'J'`
       - `트래킹파일명칭{i}` (`50B`): `F21_{device_code}_{date_time_enf}_0{lane}_J_T_0{i}_JPG` (`0x00` 50바이트 우측 패딩)
       - `트래킹파일크기{i}` (`4B >I` uint32): `len(img)`
       - `트래킹파일정보{i}` (`NB`): `img` 바이트
