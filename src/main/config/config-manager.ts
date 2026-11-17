import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import type { AtojAppConfig, InvalidFilePolicy } from '@shared/types/domain';

dotenv.config();

const DEFAULT_CONFIG: AtojAppConfig = {
  path: {
    source: ['C:/save_std2', 'D:/MuinServer/2_Metafile/Signal', 'D:/MuinServer/2_Metafile/Speed'],
    target: './result',
    log: './log',
    sleep: 3,
  },
  invalidFilePolicy: (process.env.ATOJ_INVALID_FILE_POLICY as InvalidFilePolicy) || 'ignore',
  quarantineDir: process.env.ATOJ_QUARANTINE_DIR || './quarantine',
  scanExistingOnStart: true,
};

export class ConfigManager {
  private readonly configPath: string;

  constructor(customConfigPath?: string) {
    const envPath = process.env.ATOJ_CONFIG_PATH;
    this.configPath = path.resolve(customConfigPath || envPath || './config.json');
  }

  public getConfigFilePath(): string {
    return this.configPath;
  }

  public loadConfig(): AtojAppConfig {
    if (!fs.existsSync(this.configPath)) {
      this.saveConfig(DEFAULT_CONFIG);
      return { ...DEFAULT_CONFIG };
    }

    try {
      const rawText = fs.readFileSync(this.configPath, 'utf-8');
      const parsed = JSON.parse(rawText);

      const merged: AtojAppConfig = {
        path: {
          source: Array.isArray(parsed?.path?.source) ? parsed.path.source : DEFAULT_CONFIG.path.source,
          target: typeof parsed?.path?.target === 'string' ? parsed.path.target : DEFAULT_CONFIG.path.target,
          log: typeof parsed?.path?.log === 'string' ? parsed.path.log : DEFAULT_CONFIG.path.log,
          sleep: typeof parsed?.path?.sleep === 'number' ? parsed.path.sleep : DEFAULT_CONFIG.path.sleep,
        },
        invalidFilePolicy:
          parsed?.invalidFilePolicy === 'delete' ||
          parsed?.invalidFilePolicy === 'quarantine' ||
          parsed?.invalidFilePolicy === 'ignore'
            ? parsed.invalidFilePolicy
            : DEFAULT_CONFIG.invalidFilePolicy,
        quarantineDir:
          typeof parsed?.quarantineDir === 'string' ? parsed.quarantineDir : DEFAULT_CONFIG.quarantineDir,
        scanExistingOnStart:
          typeof parsed?.scanExistingOnStart === 'boolean'
            ? parsed.scanExistingOnStart
            : DEFAULT_CONFIG.scanExistingOnStart,
      };

      this.ensureDirectories(merged);
      return merged;
    } catch {
      return { ...DEFAULT_CONFIG };
    }
  }

  public saveConfig(config: AtojAppConfig): AtojAppConfig {
    const dir = path.dirname(this.configPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const legacyCompatiblePayload = {
      path: {
        source: config.path.source,
        target: config.path.target,
        log: config.path.log,
        sleep: Number(config.path.sleep) || 1,
      },
      invalidFilePolicy: config.invalidFilePolicy,
      quarantineDir: config.quarantineDir,
      scanExistingOnStart: config.scanExistingOnStart,
    };

    fs.writeFileSync(this.configPath, JSON.stringify(legacyCompatiblePayload, null, 2), 'utf-8');
    this.ensureDirectories(config);
    return config;
  }

  public ensureDirectories(config: AtojAppConfig): void {
    const dirs = [config.path.target, config.path.log];
    if (config.invalidFilePolicy === 'quarantine' && config.quarantineDir) {
      dirs.push(config.quarantineDir);
    }

    for (const d of dirs) {
      const resolved = path.resolve(d);
      if (!fs.existsSync(resolved)) {
        fs.mkdirSync(resolved, { recursive: true });
      }
    }
  }
}
