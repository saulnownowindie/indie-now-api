import multer from "multer";

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Formato de archivo no permitido."));
  }
};

const upload = multer({
  storage: multer.memoryStorage(),

  fileFilter,

limits: { fileSize: 4 * 1024 * 1024 } // 4 MB,
});

export default upload;
