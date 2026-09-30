export interface StoredFile {
  key: string; // store this in DB (local path key or Cloudinary public_id)
  url: string;
}

export interface StorageDriver {
  upload(file: Express.Multer.File, opts: { folder: string }): Promise<StoredFile>;
  delete(key: string): Promise<void>;
}