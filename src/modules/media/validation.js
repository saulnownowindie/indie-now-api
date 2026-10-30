import { z } from "zod";

export const mediaFileSchema = z.object({
  originalname: z.string().min(1),
  mimetype: z.enum([
    "image/jpeg",
    "image/png",
    "image/webp",
  ]),
  size: z.number().int().positive(),
});

export const updateMediaSchema = z
  .object({
    originalName: z
      .string()
      .trim()
      .min(1, "El nombre del archivo es obligatorio")
      .max(255, "El nombre del archivo no puede superar los 255 caracteres")
      .optional(),
    type: z
      .enum(["IMAGE", "VIDEO"], {
        message: "El tipo de archivo no es válido",
      })
      .optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debes enviar al menos un campo para actualizar",
  });

export const uploadSignatureSchema = z
  .object({
    resourceType: z.enum(["image", "video"], {
      message: "El tipo de recurso no es válido",
    }),
    folder: z.enum(
      ["reels-covers", "reels-previews", "playlist-covers"],
      {
        message: "La carpeta de destino no es válida",
      },
    ),
  })
  .strict();

export const mediaIdParamsSchema = z.object({
  id: z.coerce
    .number()
    .int("El identificador debe ser un número entero")
    .positive("El identificador debe ser válido"),
});
