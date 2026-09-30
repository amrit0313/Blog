import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import type { StorageDriver, StoredFile } from "./types";

export class LocalStorage implements StorageDriver {
  constructor(
    private readonly rootDir: string,
    private readonly baseUrl: string,
  ) {}

  async upload(file: Express.Multer.File, { folder }: { folder: string }): Promise<StoredFile> {
    // never trust originalname for the filename, only its extension
    const ext = path.extname(file.originalname).toLowerCase();
    const key = path.posix.join(folder, `${crypto.randomUUID()}${ext}`);
    const fullPath = path.join(this.rootDir, key);

    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, file.buffer);

    return { key, url: `${this.baseUrl}/${key}` };
  }

  async delete(key: string): Promise<void> {
    await fs.rm(path.join(this.rootDir, key), { force: true });
  }
}