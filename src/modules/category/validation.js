import { z } from "zod";

export const categorySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "El nombre debe tener al menos 3 caracteres")
      .max(50, "El nombre no puede superar los 50 caracteres"),
  })
  .strict();

export const categoryIdParamsSchema = z.object({
  id: z.coerce
    .number()
    .int("El identificador debe ser un número entero")
    .positive("El identificador debe ser válido"),
});
