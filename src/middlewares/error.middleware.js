import { ZodError } from "zod";
import multer from "multer";
import { Prisma } from "@prisma/client";

import { MAX_UPLOAD_SIZE } from "./upload.middleware.js";

const MAX_UPLOAD_MB = Math.round(MAX_UPLOAD_SIZE / (1024 * 1024));

const MULTER_MESSAGES = {
  LIMIT_FILE_SIZE: `La imagen supera los ${MAX_UPLOAD_MB}MB.`,
  LIMIT_FILE_COUNT: "Solo se permite subir un archivo a la vez.",
  LIMIT_UNEXPECTED_FILE: 'El archivo debe enviarse en el campo "file".',
};

export const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (Number.isInteger(err.statusCode)) {
    return res.status(err.statusCode).json({
      message: err.message,
    });
  }

  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      message: MULTER_MESSAGES[err.code] ?? err.message,
    });
  }

  if (err.message?.startsWith("Formato de archivo")) {
    return res.status(400).json({
      message: err.message,
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Error de validación",
      errors: err.issues,
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002":
        return res.status(409).json({
          message: "Ya existe un registro con ese valor.",
        });

      case "P2025":
        return res.status(404).json({
          message: "Registro no encontrado.",
        });

      case "P2003":
        return res.status(409).json({
          message: "La relación indicada no es válida.",
        });
    }
  }

  res.status(500).json({
    message: "Error interno del servidor",
  });
};