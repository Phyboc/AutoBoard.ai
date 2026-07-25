import { resolve } from 'node:path';
import { existsSync } from 'node:fs';

export function getResourcePath(fileName: string): string {
  // Primary target: src/resources
  const srcPath = resolve(process.cwd(), 'src', 'resources', fileName);
  if (existsSync(srcPath)) return srcPath;

  // Fallback target: resources
  const rootPath = resolve(process.cwd(), 'resources', fileName);
  if (existsSync(rootPath)) return rootPath;

  return srcPath;
}