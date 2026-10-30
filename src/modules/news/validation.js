import { z } from "zod";

const socialPlatforms = [
  "INSTAGRAM",
  "TIKTOK",
  "YOUTUBE",
  "FACEBOOK",
  "X",
  "THREADS",
  "OTHER",
];

const publishStatuses = ["DRAFT", "PUBLISHED"];

const homeSections = [
  "LO_NUEVO",
  "NOTICIAS",
  "REELS",
  "NO_PODES_PERDERTE",
];

export const createNewsSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(5, "El título debe tener al menos 5 caracteres")
      .max(150, "El título no puede superar los 150 caracteres"),
    platform: z.enum(socialPlatforms, {
      message: "La plataforma seleccionada no es válida",
    }),
    url: z.url("La URL no es válida"),
    categoryId: z.coerce
      .number()
      .int("La categoría debe ser un número entero")
      .positive("La categoría debe ser válida"),
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
    homeSection: z.enum(homeSections, {
      message: "La sección de la Home no es válida",
    }).optional(),
    sortOrder: z.coerce
      .number()
      .int("El orden debe ser un número entero")
      .min(0, "El orden no puede ser negativo")
      .optional(),
    publishedAt: z.coerce.date().nullable().optional(),
  })
  .strict();

export const updateNewsSchema = createNewsSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debes enviar al menos un campo para actualizar",
  });

export const newsIdParamsSchema = z.object({
  id: z.coerce
    .number()
    .int("El identificador debe ser un número entero")
    .positive("El identificador debe ser válido"),
});
