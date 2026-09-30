import path from "path";
import { LocalStorage } from "./local";
import { CloudinaryStorage } from "./cloudinary";
import type { StorageDriver } from "./types";

export const UPLOADS_DIR = path.join(__dirname, "../../uploads");

function createStorage(): StorageDriver {
  const driver =
    process.env.STORAGE_DRIVER ??
    (process.env.NODE_ENV === "production" ? "cloudinary" : "local");

  switch (driver) {
    case "cloudinary":
      return new CloudinaryStorage({
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET,
      });
    case "local":
      return new LocalStorage(
        UPLOADS_DIR,
        `${process.env.BACKEND_URL ?? "http://localhost:5000"}/uploads`,
      );
    default:
      throw new Error(`Unknown STORAGE_DRIVER: ${driver}`);
  }
}

export const storage = createStorage();
export const usesLocalStorage = !(
  (process.env.STORAGE_DRIVER ??
    (process.env.NODE_ENV === "production" ? "cloudinary" : "local")) ===
  "cloudinary"
);
