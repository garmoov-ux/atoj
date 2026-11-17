import type { AtojElectronApi } from '@shared/ipc-channels';

declare global {
  interface Window {
    atojApi: AtojElectronApi;
  }
}
export {};
