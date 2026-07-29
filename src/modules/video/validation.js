import { z } from "zod";
import { isValidYouTubeUrl } from "../../utils/youtube.js";

const publishStatuses = ["DRAFT", "PUBLISHED"];

const youtubeUrlSchema = z
  .url("La URL no es válida")
  .refine(isValidYouTubeUrl, {
    message: "La URL debe pertenecer a un video de YouTube válido",
  });

export const createVideoSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(5, "El título debe tener al menos 5 caracteres")
      .max(150, "El título no puede superar los 150 caracteres"),
    youtubeUrl: youtubeUrlSchema,
    categoryId: z.coerce
      .number()
      .int("La categoría debe ser un número entero")
      .positive("La categoría debe ser válida")
      .nullable()
      .optional(),
    coverImageId: z.coerce
      .number()
      .int("La portada debe ser un número entero")
      .positive("La portada debe ser válida")
      .nullable()
      .optional(),
    featured: z.boolean().optional(),
    isVisible: z.boolean().optional(),
    seoTitle: z
      .string()
      .trim()
      .max(150, "El título SEO no puede superar los 150 caracteres")
      .nullable()
      .optional(),
    seoDescription: z
      .string()
      .trim()
      .max(300, "La descripción SEO no puede superar los 300 caracteres")
      .nullable()
      .optional(),
    status: z.enum(publishStatuses, {
      message: "El estado seleccionado no es válido",
    }).optional(),
    publishedAt: z.coerce.date().nullable().optional(),
  })
  .strict();

export const updateVideoSchema = createVideoSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debes enviar al menos un campo para actualizar",
  });

export const videoIdParamsSchema = z.object({
  id: z.coerce
    .number()
    .int("El identificador debe ser un número entero")
    .positive("El identificador debe ser válido"),
});
