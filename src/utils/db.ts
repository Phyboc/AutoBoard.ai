import fs from 'fs/promises';
import path from 'path';

const RESOURCES_DIR = path.join(process.cwd(), 'src', 'resources');

function resolveDataPath(filename: string): string {
  return path.join(RESOURCES_DIR, filename);
}

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(RESOURCES_DIR, { recursive: true });
}

export async function readDB(filename: string): Promise<any> {
  try {
    await ensureDataDir();
    const filePath = resolveDataPath(filename);
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      if (!data || !data.trim()) {
        return [];
      }
      const parsed = JSON.parse(data);
      return parsed !== null && parsed !== undefined ? parsed : [];
    } catch (readError: any) {
      if (readError.code === 'ENOENT') {
        return [];
      }
      console.error(`[DB] Failed to read ${filename}:`, readError);
      return [];
    }
  } catch (error) {
    console.error(`[DB] Directory creation failed for ${filename}:`, error);
    return [];
  }
}

export async function writeDB(filename: string, data: any): Promise<boolean> {
  try {
    await ensureDataDir();
    const filePath = resolveDataPath(filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error(`[DB] Failed to write to ${filename}:`, error);
    return false;
  }
}