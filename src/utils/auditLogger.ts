import path from 'node:path';
import { readDB, writeDB } from './db.js';

export interface AuditLog {
  timestamp?: string;
  employee: string;
  action: string;
  system: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING_CONFIRMATION' | 'NO_OP';
  details?: string;
}

export async function logAudit(entry: AuditLog): Promise<void> {
  const resolvedPath = path.resolve(process.cwd(), 'src', 'resources', 'audit.json');
  console.log(`[AUDIT DEBUG] Attempting write to: ${resolvedPath}`);

  try {
    const existingLogs = await readDB('audit.json');

    const newLog: AuditLog = {
      timestamp: new Date().toISOString(),
      ...entry,
    };

    existingLogs.push(newLog);

    const written = await writeDB('audit.json', existingLogs);

    if (written) {
      console.log(`[AUDIT SUCCESS] ${newLog.action} recorded for ${newLog.employee}`);
    } else {
      console.error(`[AUDIT FAILURE] writeDB returned false for ${newLog.action}`);
    }
  } catch (error) {
    console.error('[AUDIT CRITICAL ERROR]', error);
  }
}