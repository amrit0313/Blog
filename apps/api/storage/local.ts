import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import type { StorageDriver, StoredFile } from "./types";

/**
 * Storage driver for saving uploaded files to the local filesystem.
 */
export class LocalStorage implements StorageDriver {
  /**
   * Creates a local filesystem storage driver.
   * @param rootDir - Directory where uploaded files are stored.
   * @param baseUrl - Public URL prefix used to access stored files.
   */
  constructor(
    private readonly rootDir: string,
    private readonly baseUrl: string,
  ) {}

  /**
   * Uploads a file to a folder under the configured root directory.
   *
   * @param file - Multer file containing the file buffer and original extension.
   * @param opts - Upload options, including the destination folder.
   * @returns The generated storage key and public URL.
   * @throws If the destination directory cannot be created or the file cannot be written.
   */
  async upload(file: Express.Multer.File, { folder }: { folder: string }): Promise<StoredFile> {
    // never trust originalname for the filename, only its extension
    const ext = path.extname(file.originalname).toLowerCase();
    const key = path.posix.join(folder, `${crypto.randomUUID()}${ext}`);
    const fullPath = path.join(this.rootDir, key);

    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, file.buffer);

    return { key, url: `${this.baseUrl}/${key}` };
  }

  /**
   * Deletes a file from the local filesystem.
   *
   * @param key - Storage key for the file to delete.
   * @returns Resolves after the deletion attempt completes.
   */
  async delete(key: string): Promise<void> {
    await fs.rm(path.join(this.rootDir, key), { force: true });
  }
}