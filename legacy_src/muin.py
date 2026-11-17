import os, re
from struct import unpack, pack
from io import BytesIO
from PIL import Image


class Convert:
    def aver_to_jver(self, file_path, save_path):
        with open(file_path, 'rb') as f:
            aver_data = unpack(
                '7s5s3s1s1s8s6s12s4s4s4s4s1s1s1s23s23s2s1s1s1s1s',
                f.read(114),
            )

            device_type = aver_data[0]
            device_code = aver_data[1]
            enf_speed = aver_data[2]
            car_type = aver_data[3]
            lane = aver_data[4]
            enf_date = aver_data[5]
            enf_time = aver_data[6]
            car_num = aver_data[7]
            car_num_x_start = aver_data[8]
            car_num_y_start = aver_data[9]
            car_num_width = aver_data[10]
            car_num_height = aver_data[11]
            use_car_num = aver_data[12]
            enf_code = aver_data[13]
            enf_type = aver_data[14]
            signal_start_pass_time = aver_data[15]
            signal_end_pass_time = aver_data[16]
            tracking_frame = aver_data[17]
            signal_shape = aver_data[18]
            car_direction = aver_data[19]
            signal_type = aver_data[20]
            trigger_type = aver_data[21]

            image_data = []

            data = f.read()
            while True:
                start_ = data.find(b'\xff\xd8')
                end_ = data.find(b'\xff\xd9')

                if start_ == -1 or end_ == -1:
                    break

                image_data.append(data[start_ : end_ + 2])
                data = data[end_ + 2 :]

            jver_data = {}

            if enf_code == b'1':
                device_type = 1
            elif enf_code == b'3':
                device_type = 3

            jver_data['위반코드'] = pack('b', device_type)
            jver_data['파일버전'] = pack('2s', b'\x00\x00')
            jver_data['차량종류'] = pack('b', int(car_type))

            car_num = str(car_num.decode('cp949')).strip()
            car_num = car_num.encode('cp949').ljust(20, b'\x00')
            jver_data['차량번호'] = pack('20s', car_num)
            jver_data['위반차로'] = pack('b', int(lane))

            date_time_enf = enf_date + enf_time + b'000'
            jver_data['위반시각'] = pack('17s', date_time_enf)
            jver_data['번호판유무'] = pack('b', int(use_car_num))

            jver_data['번호판X위치'] = pack('>h', int(car_num_x_start))
            jver_data['번호판Y위치'] = pack('>h', int(car_num_y_start))
            jver_data['번호판WIDTH'] = pack('>h', int(car_num_width))
            jver_data['번호판HEIGHT'] = pack('>h', int(car_num_height))

            if enf_code == b'1':
                jver_data['단속속도'] = pack('>h', int(enf_speed))
                jver_data['위반속도'] = pack('>h', int(enf_speed))
            elif enf_code == b'3':
                jver_data['위반속도'] = pack('>h', int(enf_speed))

                jver_data['정지선통과시간'] = pack('>d', float(signal_start_pass_time))
                jver_data['교차로통과시간'] = pack('>d', float(signal_end_pass_time))
                jver_data['신호등형태'] = pack('b', int(signal_shape))
                jver_data['차량진행형태'] = pack('b', int(car_direction))
                jver_data['신호등종류'] = pack('b', int(signal_type))

            car_c_image = image_data[0]
            jver_data['차량영상종류'] = pack('1s', b'J')

            car_c_file_name = (
                f"F21_{device_code.decode()}_{date_time_enf.decode()}_0{lane.decode()}_J_C_XX_JPG"
                .encode()
                .ljust(50, b'\x00')
            )
            jver_data['차량파일명칭'] = pack('50s', car_c_file_name)

            file_size = len(car_c_image)
            jver_data['차량파일크기'] = pack('>I', file_size)
            jver_data['차량파일정보'] = car_c_image

            car_l_image = image_data[1]
            jver_data['번호판영상종류'] = pack('1s', b'J')

            car_l_file_name = (
                f"F21_{device_code.decode()}_{date_time_enf.decode()}_0{lane.decode()}_J_L_XX_JPG"
                .encode()
                .ljust(50, b'\x00')
            )
            jver_data['번호판파일명칭'] = pack('50s', car_l_file_name)

            file_size = len(car_l_image)
            jver_data['번호판파일크기'] = pack('>I', file_size)
            jver_data['번호판파일정보'] = car_l_image

            if enf_code == b'3':
                jver_data['프레임수'] = pack('b', int(tracking_frame))

                for i, img in enumerate(image_data[2:]):
                    jver_data[f'트래킹영상종류{i}'] = pack('1s', b'J')

                    car_t_file_name = (
                        f"F21_{device_code.decode()}_{date_time_enf.decode()}_0{lane.decode()}_J_T_0{i}_JPG"
                        .encode()
                        .ljust(50, b'\x00')
                    )
                    jver_data[f'트래킹파일명칭{i}'] = pack('50s', car_t_file_name)

                    file_size = len(img)
                    jver_data[f'트래킹파일크기{i}'] = pack('>I', file_size)
                    jver_data[f'트래킹파일정보{i}'] = img

            jver_file_name = f"21_{device_code.decode()}_{date_time_enf.decode()}_0{lane.decode()}_0{device_type}.DAT"
            full_path = os.path.join(save_path, jver_file_name)

            with open(full_path, 'wb') as f:
                for key in jver_data.keys():
                    f.write(jver_data[key])

            return full_path
