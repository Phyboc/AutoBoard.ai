import fs from 'fs/promises';
import path from 'path';

// This dynamically resolves the absolute path to your resources folder
const getResourcePath = (filename: string) => path.join(process.cwd(), 'src', 'resources', filename);

export async function readDB(filename: string) {
  try {
    const data = await fs.readFile(getResourcePath(filename), 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Failed to read ${filename}:`, error);
    return null;
  }
}

export async function writeDB(filename: string, data: any) {
  try {
    await fs.writeFile(getResourcePath(filename), JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error(`Failed to write to ${filename}:`, error);
    return false;
  }
}
