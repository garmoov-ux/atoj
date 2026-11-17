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
  retention: {
    logDays: 30,
    dbHistoryDays: 90,
    resultDays: 0,
    quarantineDays: 14,
  },
  system: {
    minimizeToTrayOnClose: true,
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
        retention: {
          logDays:
            typeof parsed?.retention?.logDays === 'number'
              ? Math.max(0, parsed.retention.logDays)
              : DEFAULT_CONFIG.retention.logDays,
          dbHistoryDays:
            typeof parsed?.retention?.dbHistoryDays === 'number'
              ? Math.max(0, parsed.retention.dbHistoryDays)
              : DEFAULT_CONFIG.retention.dbHistoryDays,
          resultDays:
            typeof parsed?.retention?.resultDays === 'number'
              ? Math.max(0, parsed.retention.resultDays)
              : DEFAULT_CONFIG.retention.resultDays,
          quarantineDays:
            typeof parsed?.retention?.quarantineDays === 'number'
              ? Math.max(0, parsed.retention.quarantineDays)
              : DEFAULT_CONFIG.retention.quarantineDays,
        },
        system: {
          minimizeToTrayOnClose:
            typeof parsed?.system?.minimizeToTrayOnClose === 'boolean'
              ? parsed.system.minimizeToTrayOnClose
              : DEFAULT_CONFIG.system.minimizeToTrayOnClose,
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
      retention: {
        logDays: Math.max(0, Number(config.retention?.logDays ?? 30)),
        dbHistoryDays: Math.max(0, Number(config.retention?.dbHistoryDays ?? 90)),
        resultDays: Math.max(0, Number(config.retention?.resultDays ?? 0)),
        quarantineDays: Math.max(0, Number(config.retention?.quarantineDays ?? 14)),
      },
      system: {
        minimizeToTrayOnClose: Boolean(config.system?.minimizeToTrayOnClose ?? true),
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
