import fs from "fs";
import multer from "multer";
import path from "path";

const uploadDir = "src/uploads/images";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(null, uniqueName + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Formato de archivo no permitido."));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
  fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

export default upload;
