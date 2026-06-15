import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as archiver from 'archiver';
import { PrismaService } from '../prisma/prisma.service';

interface BackupProviderConfig {
  enabled?: boolean;
  host?: string;
  port?: string;
  username?: string;
  password?: string;
  remotePath?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  region?: string;
  bucketName?: string;
  prefix?: string;
  accessToken?: string;
  folderId?: string;
  folder?: string;
}

interface DatabaseConfig {
  host: string;
  port: string;
  username: string;
  password: string;
  database: string;
}

interface ArchiverInstance {
  on(event: string, listener: (err: any) => void): this;
  pipe(dest: fs.WriteStream): void;
  file(source: string, data: { name: string }): void;
  finalize(): Promise<void>;
}

@Injectable()
export class BackupService implements OnModuleInit {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupFolder = path.join(process.cwd(), 'backups');
  private readonly jobName = 'database-auto-backup';

  constructor(
    private readonly prisma: PrismaService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {
    // Ensure backups folder exists
    if (!fs.existsSync(this.backupFolder)) {
      fs.mkdirSync(this.backupFolder, { recursive: true });
    }
  }

  async onModuleInit() {
    await this.initializeScheduledBackup();
  }

  /**
   * Initializes or updates the scheduled backup cron job based on settings in the DB.
   */
  async initializeScheduledBackup() {
    // Delete existing job if any
    try {
      this.schedulerRegistry.deleteCronJob(this.jobName);
    } catch {
      // Ignore if job doesn't exist
    }

    const enabledSetting = await this.prisma.appSetting.findUnique({
      where: { key: 'backup_enabled' },
    });
    if (!enabledSetting || enabledSetting.value !== 'true') {
      this.logger.log('Scheduled backups are disabled.');
      return;
    }

    const frequencySetting = await this.prisma.appSetting.findUnique({
      where: { key: 'backup_frequency' },
    }); // 'daily', 'weekly', 'monthly'
    const timeSetting = await this.prisma.appSetting.findUnique({
      where: { key: 'backup_time' },
    }); // '02:00'

    const frequency = frequencySetting?.value || 'daily';
    const time = timeSetting?.value || '02:00';
    const [hour, minute] = time.split(':').map((s) => parseInt(s, 10) || 0);

    let cronExpression = `0 ${minute} ${hour} * * *`; // default daily
    if (frequency === 'weekly') {
      cronExpression = `0 ${minute} ${hour} * * 0`; // weekly on Sunday
    } else if (frequency === 'monthly') {
      cronExpression = `0 ${minute} ${hour} 1 * *`; // monthly on 1st
    }

    try {
      const job = new CronJob(cronExpression, async () => {
        this.logger.log('Executing automated database backup...');
        try {
          const backup = await this.createBackup();
          this.logger.log(
            `Automated backup created successfully: ${backup.filename}`,
          );
          await this.cleanOldBackups();
        } catch (error) {
          this.logger.error('Automated backup failed', error);
        }
      });

      this.schedulerRegistry.addCronJob(this.jobName, job);
      job.start();
      this.logger.log(
        `Scheduled backup active: ${frequency} at ${time} (${cronExpression})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to schedule backup job with expression ${cronExpression}`,
        error,
      );
    }
  }

  /**
   * Get DB connection details from env or settings.
   */
  private async getDbConfig(): Promise<DatabaseConfig> {
    const customCredsSetting = await this.prisma.appSetting.findUnique({
      where: { key: 'backup_custom_credentials' },
    });

    if (customCredsSetting && customCredsSetting.value) {
      try {
        const creds = JSON.parse(
          customCredsSetting.value,
        ) as Partial<DatabaseConfig>;
        if (creds.host && creds.database && creds.username) {
          return {
            host: creds.host,
            port: creds.port || '5432',
            username: creds.username,
            password: creds.password || '',
            database: creds.database,
          };
        }
      } catch (e) {
        this.logger.error('Failed to parse custom backup credentials', e);
      }
    }

    // Fallback to parsing DATABASE_URL
    const dbUrlStr = process.env.DATABASE_URL;
    if (!dbUrlStr) {
      throw new Error('DATABASE_URL env variable is not defined.');
    }

    try {
      const dbUrl = new URL(dbUrlStr);
      return {
        host: dbUrl.hostname || 'localhost',
        port: dbUrl.port || '5432',
        username: dbUrl.username || 'postgres',
        password: decodeURIComponent(dbUrl.password || ''),
        database: dbUrl.pathname.substring(1) || 'project_flow',
      };
    } catch {
      // Handle postgresql:// or postgres:// non-standard url parsing if URL class fails
      // e.g. postgres://postgres:admin@localhost:5434/project_flow
      const regex = /postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
      const match = dbUrlStr.match(regex);
      if (match) {
        return {
          username: match[1],
          password: match[2],
          host: match[3],
          port: match[4],
          database: match[5],
        };
      }
      throw new Error('Could not parse DATABASE_URL.');
    }
  }

  /**
   * Run pg_dump, compress to zip file, and dispatch to storage providers.
   */
  async createBackup(
    keepLocalOverride = false,
  ): Promise<{ filename: string; filePath: string; size: number }> {
    const config = await this.getDbConfig();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const sqlFilename = `backup-${config.database}-${timestamp}.sql`;
    const zipFilename = `${sqlFilename}.zip`;

    const tempSqlPath = path.join(this.backupFolder, sqlFilename);
    const zipFilePath = path.join(this.backupFolder, zipFilename);

    // Set PGPASSWORD env variable to authenticate pg_dump without prompting
    const env = { ...process.env, PGPASSWORD: config.password };

    // Construct pg_dump command
    const pgDumpCmd = `pg_dump -h "${config.host}" -p "${config.port}" -U "${config.username}" -F p -f "${tempSqlPath}" "${config.database}"`;

    this.logger.log(
      `Running pg_dump: ${pgDumpCmd.replace(config.password, '****')}`,
    );

    return new Promise((resolve, reject) => {
      exec(pgDumpCmd, { env }, (error, stdout, stderr) => {
        if (error) {
          this.logger.error(`pg_dump failed: ${stderr}`);
          if (fs.existsSync(tempSqlPath)) fs.unlinkSync(tempSqlPath);
          return reject(
            new Error(
              `Database dump execution failed: ${error.message}. Ensure pg_dump is installed and in system path.`,
            ),
          );
        }

        // Run async operations inside IIFE
        void (async () => {
          try {
            // Zip the sql file
            await this.zipFile(tempSqlPath, sqlFilename, zipFilePath);

            // Delete temp SQL file
            fs.unlinkSync(tempSqlPath);

            const stats = fs.statSync(zipFilePath);

            // Dispatch to external storage providers (SFTP, S3, GDrive, Dropbox, etc.)
            await this.runUploaderChain(
              zipFilePath,
              zipFilename,
              keepLocalOverride,
            );

            const localExists = fs.existsSync(zipFilePath);

            resolve({
              filename: zipFilename,
              filePath: localExists ? zipFilePath : '',
              size: stats.size,
            });
          } catch (zipError) {
            if (fs.existsSync(tempSqlPath)) fs.unlinkSync(tempSqlPath);
            if (fs.existsSync(zipFilePath)) fs.unlinkSync(zipFilePath);
            reject(
              zipError instanceof Error
                ? zipError
                : new Error(String(zipError)),
            );
          }
        })();
      });
    });
  }

  /**
   * Dispatches the backup file to all configured and active backup providers.
   */
  private async runUploaderChain(
    filePath: string,
    filename: string,
    keepLocalOverride: boolean,
  ) {
    const activeProvidersSetting = await this.prisma.appSetting.findUnique({
      where: { key: 'backup_active_providers' },
    });
    const configsSetting = await this.prisma.appSetting.findUnique({
      where: { key: 'backup_provider_configs' },
    });

    let activeProviders: string[] = ['local'];
    let configs: Record<string, BackupProviderConfig> = {};

    if (activeProvidersSetting && activeProvidersSetting.value) {
      try {
        activeProviders = JSON.parse(activeProvidersSetting.value) as string[];
      } catch (e) {
        this.logger.error('Failed to parse active backup providers', e);
      }
    }

    if (configsSetting && configsSetting.value) {
      try {
        configs = JSON.parse(configsSetting.value) as Record<
          string,
          BackupProviderConfig
        >;
      } catch (e) {
        this.logger.error('Failed to parse backup provider configs', e);
      }
    }

    this.logger.log(
      `Running backup upload chain for providers: ${activeProviders.join(', ')}`,
    );

    for (const provider of activeProviders) {
      if (provider === 'local') continue;

      const providerConfig = configs[provider];
      if (!providerConfig || !providerConfig.enabled) {
        continue;
      }

      try {
        if (provider === 'sftp') {
          await this.uploadToSFTP(filePath, filename, providerConfig);
        } else if (provider === 's3') {
          await this.uploadToS3(filePath, filename, providerConfig);
        } else if (provider === 'google_drive') {
          await this.uploadToGoogleDrive(filePath, filename, providerConfig);
        } else if (provider === 'dropbox') {
          await this.uploadToDropbox(filePath, filename, providerConfig);
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `Failed uploading backup to provider [${provider}]: ${errMsg}`,
          err,
        );
      }
    }

    // Delete local zip if 'local' is not in active providers and we are not forcing local retention
    if (!activeProviders.includes('local') && !keepLocalOverride) {
      this.logger.log(
        `Local backup storage disabled. Deleting temporary local archive: ${filePath}`,
      );
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (e) {
        this.logger.error(
          `Failed to clean up local backup archive: ${filePath}`,
          e,
        );
      }
    }
  }

  private async uploadToSFTP(
    filePath: string,
    filename: string,
    config: BackupProviderConfig,
  ) {
    this.logger.log(
      `Uploading ${filename} to SFTP Server ${config.host || ''}...`,
    );
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Client = require('ssh2-sftp-client') as new () => {
        connect(options: Record<string, unknown>): Promise<void>;
        put(localPath: string, remotePath: string): Promise<void>;
        end(): Promise<void>;
      };
      const sftp = new Client();

      await sftp.connect({
        host: config.host,
        port: config.port ? parseInt(config.port, 10) : 22,
        username: config.username,
        password: config.password,
      });

      const remoteFilePath = path
        .join(config.remotePath || '.', filename)
        .replace(/\\/g, '/');
      await sftp.put(filePath, remoteFilePath);
      await sftp.end();
      this.logger.log(`SFTP upload completed successfully.`);
    } catch (err) {
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code: string }).code === 'MODULE_NOT_FOUND'
      ) {
        this.logger.warn(
          `ssh2-sftp-client is not installed. (Simulated upload to SFTP: ${
            config.host || ''
          })`,
        );
      } else {
        throw err;
      }
    }
  }

  private async uploadToS3(
    filePath: string,
    filename: string,
    config: BackupProviderConfig,
  ) {
    this.logger.log(
      `Uploading ${filename} to S3 Bucket ${config.bucketName || ''}...`,
    );
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3') as {
        S3Client: new (options: Record<string, unknown>) => {
          send(command: unknown): Promise<void>;
        };
        PutObjectCommand: new (options: Record<string, unknown>) => unknown;
      };

      const client = new S3Client({
        region: config.region || 'us-east-1',
        credentials: {
          accessKeyId: config.accessKeyId || '',
          secretAccessKey: config.secretAccessKey || '',
        },
      });

      const key = `${config.prefix || ''}${filename}`.replace(/\/+/g, '/');
      const fileStream = fs.createReadStream(filePath);

      await client.send(
        new PutObjectCommand({
          Bucket: config.bucketName || '',
          Key: key,
          Body: fileStream,
        }),
      );

      this.logger.log(`S3 upload completed successfully.`);
    } catch (err) {
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code: string }).code === 'MODULE_NOT_FOUND'
      ) {
        this.logger.warn(
          `@aws-sdk/client-s3 is not installed. (Simulated upload to S3 Bucket: ${
            config.bucketName || ''
          })`,
        );
      } else {
        throw err;
      }
    }
  }

  private async uploadToGoogleDrive(
    filePath: string,
    filename: string,
    config: BackupProviderConfig,
  ) {
    this.logger.log(`Uploading ${filename} to Google Drive...`);
    if (!config.accessToken) {
      throw new Error('Google Drive Access Token is missing.');
    }

    const fileBuffer = fs.readFileSync(filePath);
    const metadata = {
      name: filename,
      parents: config.folderId ? [config.folderId] : undefined,
    };

    const boundary = 'projectflow_backup_boundary';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody = Buffer.concat([
      Buffer.from(
        delimiter +
          'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
          JSON.stringify(metadata),
      ),
      Buffer.from(delimiter + 'Content-Type: application/zip\r\n\r\n'),
      fileBuffer,
      Buffer.from(closeDelimiter),
    ]);

    const res = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
          'Content-Length': multipartRequestBody.length.toString(),
        },
        body: multipartRequestBody as unknown as BodyInit,
      },
    );

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(
        `Google Drive API returned status ${res.status}: ${errText}`,
      );
    }

    const data = (await res.json()) as { id: string };
    this.logger.log(`Google Drive upload successful. File ID: ${data.id}`);
  }

  private async uploadToDropbox(
    filePath: string,
    filename: string,
    config: BackupProviderConfig,
  ) {
    this.logger.log(`Uploading ${filename} to Dropbox...`);
    if (!config.accessToken) {
      throw new Error('Dropbox Access Token is missing.');
    }

    const fileStream = fs.createReadStream(filePath);
    const remotePath = `${config.folder || ''}/${filename}`.replace(
      /\/+/g,
      '/',
    );

    const res = await fetch('https://content.dropboxapi.com/2/files/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Dropbox-API-Arg': JSON.stringify({
          path: remotePath,
          mode: 'add',
          autorename: true,
          mute: false,
        }),
        'Content-Type': 'application/octet-stream',
      },
      body: fileStream as unknown as BodyInit,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Dropbox API returned status ${res.status}: ${errText}`);
    }

    const data = (await res.json()) as { path_display: string };
    this.logger.log(`Dropbox upload successful. Path: ${data.path_display}`);
  }

  private zipFile(
    sourceFile: string,
    innerName: string,
    outputFile: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outputFile);
      const archive = (
        archiver as unknown as (
          type: string,
          opts: Record<string, unknown>,
        ) => ArchiverInstance
      )('zip', { zlib: { level: 9 } });

      output.on('close', () => resolve());
      archive.on('error', (err: any) =>
        reject(err instanceof Error ? err : new Error(String(err))),
      );

      archive.pipe(output);
      archive.file(sourceFile, { name: innerName });
      void archive.finalize();
    });
  }

  async listBackups(): Promise<
    Array<{ filename: string; size: number; createdAt: Date }>
  > {
    await Promise.resolve();
    if (!fs.existsSync(this.backupFolder)) {
      return [];
    }

    const files = fs.readdirSync(this.backupFolder);
    return files
      .filter((file) => file.endsWith('.zip'))
      .map((file) => {
        const filePath = path.join(this.backupFolder, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          size: stats.size,
          createdAt: stats.birthtime,
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Delete a specific backup file.
   */
  async deleteBackup(filename: string): Promise<{ success: boolean }> {
    await Promise.resolve();
    const safeFilename = path.basename(filename);
    const filePath = path.join(this.backupFolder, safeFilename);

    if (fs.existsSync(filePath) && filePath.startsWith(this.backupFolder)) {
      fs.unlinkSync(filePath);
      return { success: true };
    }
    throw new Error('Backup file not found or path traversal attempt.');
  }

  /**
   * Cleans up old backups exceeding retention days.
   */
  async cleanOldBackups() {
    const retentionSetting = await this.prisma.appSetting.findUnique({
      where: { key: 'backup_retention_days' },
    });
    const retentionDays = parseInt(retentionSetting?.value || '30', 10) || 30;

    const backups = await this.listBackups();
    const now = new Date();

    for (const backup of backups) {
      const diffTime = Math.abs(now.getTime() - backup.createdAt.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > retentionDays) {
        this.logger.log(
          `Cleaning up old backup file: ${backup.filename} (retention limit: ${retentionDays} days)`,
        );
        await this.deleteBackup(backup.filename);
      }
    }
  }

  getBackupPath(filename: string): string {
    const safeFilename = path.basename(filename);
    const filePath = path.join(this.backupFolder, safeFilename);
    if (fs.existsSync(filePath) && filePath.startsWith(this.backupFolder)) {
      return filePath;
    }
    throw new Error('File not found');
  }
}
