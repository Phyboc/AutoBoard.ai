import fs from 'fs/promises';
import path from 'path';

const RESOURCES_DIR = path.join(process.cwd(), 'src', 'resources');

function resolveDataPath(filename: string): string {
  return path.join(RESOURCES_DIR, filename);
}

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(RESOURCES_DIR, { recursive: true });
}

export async function readDB(filename: string): Promise<any[]> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(resolveDataPath(filename), 'utf-8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(`[DB] Failed to read ${filename}:`, error);
    return [];
  }
}

export async function writeDB(filename: string, data: any): Promise<boolean> {
  try {
    await ensureDataDir();
    await fs.writeFile(resolveDataPath(filename), JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error(`[DB] Failed to write to ${filename}:`, error);
    return false;
  }
}
