import { v2 as cloudinary } from "cloudinary";
import type { StorageDriver, StoredFile } from "./types";

export class CloudinaryStorage implements StorageDriver {
  constructor(cfg: { cloudName?: string; apiKey?: string; apiSecret?: string }) {
    if (!cfg.cloudName || !cfg.apiKey || !cfg.apiSecret) {
      throw new Error("Missing Cloudinary credentials in environment");
    }
    cloudinary.config({
      cloud_name: cfg.cloudName,
      api_key: cfg.apiKey,
      api_secret: cfg.apiSecret,
      secure: true,
    });
  }

  upload(file: Express.Multer.File, { folder }: { folder: string }): Promise<StoredFile> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: "image" },
        (err, result) => {
          if (err || !result) return reject(err ?? new Error("Cloudinary upload failed"));
          resolve({ key: result.public_id, url: result.secure_url });
        },
      );
      stream.end(file.buffer);
    });
  }

  async delete(key: string): Promise<void> {
    await cloudinary.uploader.destroy(key);
  }
}