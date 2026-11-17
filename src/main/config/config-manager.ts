import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import type { AtojAppConfig, InvalidFilePolicy } from '@shared/types/domain';

dotenv.config();

const DEFAULT_CONFIG: AtojAppConfig = {
  paths: {
    sources: ['C:/save_std2', 'D:/MuinServer/2_Metafile/Signal', 'D:/MuinServer/2_Metafile/Speed'],
    targetDir: './result',
    logDir: './log',
    quarantineDir: process.env.ATOJ_QUARANTINE_DIR || './quarantine',
  },
  watcher: {
    writeStabilitySec: 3,
    scanExistingOnStart: true,
    invalidFilePolicy: (process.env.ATOJ_INVALID_FILE_POLICY as InvalidFilePolicy) || 'ignore',
  },
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
      return structuredClone(DEFAULT_CONFIG);
    }

    try {
      const rawText = fs.readFileSync(this.configPath, 'utf-8');
      const parsed = JSON.parse(rawText);

      // 신규 스키마(paths / watcher) 및 구형 레거시 스키마(path.source / path.sleep) 자동 호환
      const sources = Array.isArray(parsed?.paths?.sources)
        ? parsed.paths.sources
        : Array.isArray(parsed?.path?.source)
          ? parsed.path.source
          : DEFAULT_CONFIG.paths.sources;

      const targetDir =
        typeof parsed?.paths?.targetDir === 'string'
          ? parsed.paths.targetDir
          : typeof parsed?.path?.target === 'string'
            ? parsed.path.target
            : DEFAULT_CONFIG.paths.targetDir;

      const logDir =
        typeof parsed?.paths?.logDir === 'string'
          ? parsed.paths.logDir
          : typeof parsed?.path?.log === 'string'
            ? parsed.path.log
            : DEFAULT_CONFIG.paths.logDir;

      const quarantineDir =
        typeof parsed?.paths?.quarantineDir === 'string'
          ? parsed.paths.quarantineDir
          : typeof parsed?.quarantineDir === 'string'
            ? parsed.quarantineDir
            : DEFAULT_CONFIG.paths.quarantineDir;

      const writeStabilitySec =
        typeof parsed?.watcher?.writeStabilitySec === 'number'
          ? parsed.watcher.writeStabilitySec
          : typeof parsed?.path?.sleep === 'number'
            ? parsed.path.sleep
            : DEFAULT_CONFIG.watcher.writeStabilitySec;

      const scanExistingOnStart =
        typeof parsed?.watcher?.scanExistingOnStart === 'boolean'
          ? parsed.watcher.scanExistingOnStart
          : typeof parsed?.scanExistingOnStart === 'boolean'
            ? parsed.scanExistingOnStart
            : DEFAULT_CONFIG.watcher.scanExistingOnStart;

      const rawPolicy = parsed?.watcher?.invalidFilePolicy ?? parsed?.invalidFilePolicy;
      const invalidFilePolicy: InvalidFilePolicy =
        rawPolicy === 'delete' || rawPolicy === 'quarantine' || rawPolicy === 'ignore'
          ? rawPolicy
          : DEFAULT_CONFIG.watcher.invalidFilePolicy;

      const merged: AtojAppConfig = {
        paths: {
          sources,
          targetDir,
          logDir,
          quarantineDir,
        },
        watcher: {
          writeStabilitySec: Math.max(1, Number(writeStabilitySec) || 3),
          scanExistingOnStart,
          invalidFilePolicy,
        },
      };

      this.ensureDirectories(merged);
      return merged;
    } catch {
      return structuredClone(DEFAULT_CONFIG);
    }
  }

  public saveConfig(config: AtojAppConfig): AtojAppConfig {
    const dir = path.dirname(this.configPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const cleanConfig: AtojAppConfig = {
      paths: {
        sources: config.paths.sources,
        targetDir: config.paths.targetDir,
        logDir: config.paths.logDir,
        quarantineDir: config.paths.quarantineDir,
      },
      watcher: {
        writeStabilitySec: Math.max(1, Number(config.watcher.writeStabilitySec) || 3),
        scanExistingOnStart: Boolean(config.watcher.scanExistingOnStart),
        invalidFilePolicy: config.watcher.invalidFilePolicy,
      },
    };

    fs.writeFileSync(this.configPath, JSON.stringify(cleanConfig, null, 2), 'utf-8');
    this.ensureDirectories(cleanConfig);
    return cleanConfig;
  }

  public ensureDirectories(config: AtojAppConfig): void {
    const dirs = [config.paths.targetDir, config.paths.logDir];
    if (config.watcher.invalidFilePolicy === 'quarantine' && config.paths.quarantineDir) {
      dirs.push(config.paths.quarantineDir);
    }

    for (const d of dirs) {
      const resolved = path.resolve(d);
      if (!fs.existsSync(resolved)) {
        fs.mkdirSync(resolved, { recursive: true });
      }
    }
  }
}
