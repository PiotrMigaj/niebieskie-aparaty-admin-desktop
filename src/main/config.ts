import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';

function loadEnv(): void {
  const isDev = !app.isPackaged;
  // In dev: check electron-app/.env first, then fall back to project root .env
  const devPaths = [
    path.resolve(__dirname, '../../.env'),    // electron-app/.env
    path.resolve(__dirname, '../../../.env'),  // project root .env
  ];
  const envPath = isDev
    ? devPaths.find(fs.existsSync) ?? devPaths[0]
    : path.join(app.getPath('userData'), '.env');

  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

export interface AppConfig {
  aws: {
    accessKey: string;
    secretKey: string;
    region: string;
    bucketName: string;
  };
  auth: {
    users: Map<string, string>;
  };
  compression: {
    maxWidth: number;
    quality: number;
  };
}

let _config: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (_config) return _config;

  loadEnv();

  const accessKey = process.env.AWS_ACCESS_KEY;
  const secretKey = process.env.AWS_SECRET_KEY;
  const bucketName = process.env.AWS_BUCKET_NAME;
  const piotrPassword = process.env.PIOTR_PASSWORD;
  const annaPassword = process.env.ANNA_PASSWORD;

  if (!accessKey || !secretKey || !bucketName || !piotrPassword || !annaPassword) {
    throw new Error(
      'Missing required environment variables. Please check your .env file.\n' +
      'Required: AWS_ACCESS_KEY, AWS_SECRET_KEY, AWS_BUCKET_NAME, PIOTR_PASSWORD, ANNA_PASSWORD'
    );
  }

  const users = new Map<string, string>();
  users.set('pmigaj@gmail.com', piotrPassword);
  users.set('kozlowska0705@gmail.com', annaPassword);

  _config = {
    aws: {
      accessKey,
      secretKey,
      region: process.env.AWS_REGION ?? 'eu-central-1',
      bucketName,
    },
    auth: { users },
    compression: {
      maxWidth: 2500,
      quality: 85,
    },
  };

  return _config;
}
