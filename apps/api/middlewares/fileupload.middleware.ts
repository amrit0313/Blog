import multer from "multer";
import fs from "fs";
import path from "path";

const createStorage = (folder: string) => {
  const uploadDir = path.join(__dirname, `../uploads/${folder}`);

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${file.originalname}`;
      cb(null, uniqueName);
    },
  });
};

const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"));
  }
};

export const profileUpload = multer({
  storage: createStorage("profiles"),
  fileFilter,
});

export const blogUpload = multer({
  storage: createStorage("blogs"),
  fileFilter,
});