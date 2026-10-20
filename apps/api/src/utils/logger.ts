/**
 * Lightweight structured logger.
 * In production, emits JSON lines. In development, emits readable text.
 */
import { env } from '../config/env';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function log(level: LogLevel, message: string, meta?: unknown) {
  if (env.NODE_ENV === 'production') {
    process.stdout.write(
      JSON.stringify({ level, message, ...(meta !== undefined ? { meta } : {}), ts: new Date().toISOString() }) + '\n',
    );
  } else {
    const prefix = { info: '📘', warn: '⚠️ ', error: '❌', debug: '🔍' }[level];
    console.log(`${prefix} [${level.toUpperCase()}] ${message}`, meta !== undefined ? meta : '');
  }
}

export const logger = {
  info: (msg: string, meta?: unknown) => log('info', msg, meta),
  warn: (msg: string, meta?: unknown) => log('warn', msg, meta),
  error: (msg: string, meta?: unknown) => log('error', msg, meta),
  debug: (msg: string, meta?: unknown) => {
    if (env.NODE_ENV !== 'production') log('debug', msg, meta);
  },
};
