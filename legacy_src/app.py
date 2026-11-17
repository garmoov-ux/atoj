import logging
import json
import os
import time
import re
import atexit
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from muin import Convert


class Log:
    def __init__(self, logger_name):
        self.logger = logging.getLogger(logger_name)
        self.logger.setLevel(logging.INFO)
        self.formatter = logging.Formatter('[%(asctime)s] [%(name)s] [%(levelname)s] - %(message)s')

    def setup_handlers(self, file_name):
        if len(self.logger.handlers) > 0:
            self.logger.handlers.clear()

        stream_handler = logging.StreamHandler()
        stream_handler.setFormatter(self.formatter)

        file_handler = logging.FileHandler(file_name, encoding='utf-8')
        file_handler.setFormatter(self.formatter)

        self.logger.addHandler(stream_handler)
        self.logger.addHandler(file_handler)


class Handler(FileSystemEventHandler):
    def __init__(self, json_file):
        self.json_file = json_file
        self.last_date = time.strftime('%Y%m%d')

        self.monitor = Log('Watchdog')
        self.monitor.setup_handlers(self.get_log_file_name())
        self.monitor.logger.info('[와치독 실행됨]')

        self.convert = Convert()

        atexit.register(self.on_exit)

    def on_created(self, event):
        if event.is_directory:
            return

        if self.refresh_last_date():
            self.monitor.setup_handlers(self.get_log_file_name())
            self.monitor.logger.info('[새로운 날짜에 대한 이벤트 발생]')

        self.monitor.logger.info('[새로운 파일 생성 이벤트 발생]')
        self.monitor.logger.info(f'{event.src_path}')

        time.sleep(self.json_file['path']['sleep'])

        if self.validate_aver_file(event.src_path):
            try:
                if os.path.isfile(event.src_path):
                    full_path = event.src_path
                    target_path = os.path.abspath(self.json_file['path']['target'])
                    converted_path = self.convert.aver_to_jver(full_path, target_path)

                    self.monitor.logger.info('[자규격 파일 저장 완료]')
                    self.monitor.logger.info(f'소스폴더: {os.path.dirname(full_path)}')
                    self.monitor.logger.info(f'타겟폴더: {os.path.abspath(target_path)}')
                    self.monitor.logger.info(f'파일경로: {os.path.abspath(converted_path)}')

                    os.remove(full_path)
            except Exception as e:
                self.monitor.logger.info('[자규격 변환 실패]')
                self.monitor.logger.info(f'{e}')
        else:
            self.monitor.logger.info('[아규격 파일 아님]')
            os.remove(event.src_path)

    def on_deleted(self, event):
        self.monitor.logger.info(f'[파일 삭제 이벤트 발생] {event.src_path}')

    def validate_aver_file(self, path):
        pattern = re.compile(r'\d{16}\.[A-Z]\d{4}$')
        return bool(pattern.search(path))

    def on_exit(self):
        self.monitor.logger.info('[와치독 종료됨]')

    def get_log_file_name(self):
        return os.path.join(self.json_file['path']['log'], f'watchdog_{self.last_date}.log')

    def refresh_last_date(self):
        current_date = time.strftime('%Y%m%d')
        if current_date != self.last_date:
            self.last_date = current_date
            return True
        return False


class Watcher:
    def __init__(self, json_file):
        self.json_file = json_file
        self.last_date = time.strftime('%Y%m%d')
        self.observer_list = []

        self.monitor = Log('Observer')
        self.monitor.setup_handlers(self.get_log_file_name())

    def start_observers(self):
        source_paths = self.json_file.get('path', {}).get('source', [])
        if not source_paths:
            self.monitor.logger.error('[옵저버 생성 실패] 관찰할 경로가 없습니다.')
            return

        for path in source_paths:
            if not os.path.isdir(path):
                self.monitor.logger.error(f'[경로 오류] 존재하지 않는 경로: {path}')
                continue

            event_handler = Handler(self.json_file)
            observer = Observer()
            observer.schedule(event_handler, path, recursive=True)
            observer.start()
            self.observer_list.append(observer)

        if self.observer_list:
            self.monitor.logger.info('[옵저버 실행됨]')
        else:
            self.monitor.logger.error('[옵저버 실행 실패] 모든 경로가 잘못되었습니다.')

    def stop(self):
        for observer in self.observer_list:
            try:
                observer.stop()
                observer.join()
            except Exception as e:
                self.monitor.logger.error(f'[옵저버 종료 실패] {e}')

    def start_watching(self):
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            self.stop()
            self.monitor.logger.info('[옵저버 종료됨]')

    def get_log_file_name(self):
        return os.path.join(self.json_file['path']['log'], f'observer_{self.last_date}.log')


class Config:
    def read_json(self):
        config_file = 'config.json'

        if not os.path.isfile(config_file):
            with open(config_file, 'w', encoding='utf8') as f:
                json.dump(
                    {
                        'path': {
                            'source': [],
                            'target': './result',
                            'log': './log',
                            'sleep': 1,
                        }
                    },
                    f,
                    indent=2,
                )

        with open(config_file, 'r', encoding='utf8') as f:
            data = json.load(f)

        return data

    def create_folder(self, path):
        if not os.path.isdir(path):
            os.makedirs(path)


if __name__ == '__main__':
    try:
        config = Config()
        config_json_file = config.read_json()
        config.create_folder(config_json_file['path']['log'])
        config.create_folder(config_json_file['path']['target'])

        watch = Watcher(config_json_file)
        watch.start_observers()
        watch.start_watching()
    except Exception as e:
        print(f'[ERROR] {e}')
        exit(1)
