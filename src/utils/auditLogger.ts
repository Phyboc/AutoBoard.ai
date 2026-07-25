import { readDB, writeDB } from './db.js';

export interface AuditLog {
  timestamp?: string;
  employee: string;
  action: string;
  system: string;
  status: 'SUCCESS' | 'FAILED' | 'WAITING_CONFIRMATION';
  details?: string;
}

export async function logAudit(entry: AuditLog): Promise<void> {
  try {
    const logs = (await readDB('audit.json')) || [];

    const newLog = {
      timestamp: new Date().toISOString(),
      ...entry
    };

    logs.push(newLog);
    await writeDB('audit.json', logs);
    
    console.log(`[AUDIT] ${newLog.action} | ${newLog.employee} | ${newLog.status}`);
  } catch (error) {
    console.error('CRITICAL: Failed to write to audit.json', error);
  }
}s