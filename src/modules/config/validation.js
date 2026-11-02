import { z } from "zod";

export const updateSiteConfigSchema = z
  .object({
    heroYoutubeUrl: z
      .string()
      .trim()
      .max(500, "La URL no puede superar los 500 caracteres")
      .nullable()
      .optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debes enviar al menos un campo para actualizar",
  });
