import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

export const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (Number.isInteger(err.statusCode)) {
    return res.status(err.statusCode).json({
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
