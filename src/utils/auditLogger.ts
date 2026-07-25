import { readDB, writeDB } from './db.js';

export interface AuditLog {
  timestamp?: string;
  employee: string;
  action: string;
  system: string;
  status: 'SUCCESS' | 'FAILED' | 'WAITING_CONFIRMATION';
  details?: string;
}

/**
 * Log an audit event to `audit.json`.
 *
 * Safely appends to the existing array (readDB now guarantees a valid Array).
 * Outputs a human-readable console message on success or errors on failure.
 */
export async function logAudit(entry: AuditLog): Promise<void> {
  try {
    // readDB now always returns a valid Array (never null/undefined)
    const logs: any[] = await readDB('audit.json');

    const newLog = {
      timestamp: new Date().toISOString(),
      ...entry
    };

    logs.push(newLog);
    const written = await writeDB('audit.json', logs);

    if (written) {
      console.log(`[AUDIT LOGGED] ${newLog.action} | ${newLog.employee} | ${newLog.status} | ${newLog.system}`);
    } else {
      console.error(`[AUDIT FAILED] Could not persist audit entry: ${newLog.action} | ${newLog.employee}`);
    }
  } catch (error) {
    console.error('[AUDIT CRITICAL] Failed to write audit log entry:', error);
  }
}