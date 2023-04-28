import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

function readFile(storagePath: string, file: string) {
  return JSON.parse(readFileSync(join(storagePath, file), 'utf-8'));
}

function writeFile(storagePath: string, file: string, content: any) {
  return writeFileSync(join(storagePath, file), JSON.stringify(content));
}

function listFiles(storagePath: string) {
  const files = readdirSync(storagePath, { withFileTypes: true });
  return files.filter(f => f.isFile()).map(f => f.name);
}

export class FileMap extends Map<string, any> {
  constructor(protected storagePath: string) {
    const files = listFiles(storagePath);
    const entries: any = [files.map(file => [file, readFile(storagePath, file)])];
    super(entries);
  }

  set(key: string, value: any) {
    const v = super.set(key, value);
    writeFile(this.storagePath, key, value);
    return v;
  }
}