import { v2 as cloudinary } from "cloudinary";
import type { StorageDriver, StoredFile } from "./types";

/**
 * Storage driver for uploading and deleting images in Cloudinary.
 */
export class CloudinaryStorage implements StorageDriver {
  /**
   * Configures the Cloudinary client.
   *
   * @param cfg - Cloudinary credentials.
   * @throws {Error} If a required credential is missing.
   */
  constructor(cfg: {
    cloudName?: string;
    apiKey?: string;
    apiSecret?: string;
  }) {
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

  /**
   * Uploads an image to a Cloudinary folder.
   *
   * @param file - Multer file containing the image buffer.
   * @param opts - Upload options, including the destination folder.
   * @returns The Cloudinary public ID and secure URL.
   * @throws If Cloudinary rejects the upload.
   *
   * @example
   * const storedFile = await storage.upload(file, { folder: "blogs" });
   */
  upload(
    file: Express.Multer.File,
    { folder }: { folder: string },
  ): Promise<StoredFile> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: "image" },
        (err, result) => {
          if (err || !result)
            return reject(err ?? new Error("Cloudinary upload failed"));
          resolve({ key: result.public_id, url: result.secure_url });
        },
      );
      stream.end(file.buffer);
    });
  }

  /**
   * Deletes an image from Cloudinary.
   *
   * @param key - Cloudinary public ID for the image.
   * @returns Resolves after the deletion request completes.
   * @throws If Cloudinary rejects the deletion request.
   *
   * @example
   * await storage.delete("blogs/example-image");
   */
  async delete(key: string): Promise<void> {
    await cloudinary.uploader.destroy(key);
  }
}
