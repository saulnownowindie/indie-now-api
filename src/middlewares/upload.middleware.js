import multer from "multer";

export const MAX_UPLOAD_SIZE = 4 * 1024 * 1024; // 4 MB

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

// Error de validación del cliente: el error.middleware.js lo devuelve como 400.
class UploadValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "UploadValidationError";
    this.statusCode = 400;
  }
}

const fileFilter = (req, file, cb) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    return cb(null, true);
  }

  return cb(
    new UploadValidationError(
      "Formato de archivo no permitido. Usa JPG, PNG o WEBP.",
    ),
  );
};

const upload = multer({
  storage: multer.memoryStorage(),

  fileFilter,

  limits: {
    fileSize: MAX_UPLOAD_SIZE,
    files: 1,
  },
});

export default upload;
