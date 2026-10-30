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

export const createReelSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "El título debe tener al menos 3 caracteres")
      .max(150, "El título no puede superar los 150 caracteres"),
    platform: z.enum(socialPlatforms, {
      message: "La plataforma seleccionada no es válida",
    }),
    url: z.url("La URL no es válida"),
    videoUrl: z
      .url("La URL del video no es válida")
      .nullable()
      .optional(),
    coverImageId: z.coerce
      .number()
      .int("La portada debe ser un número entero")
      .positive("La portada debe ser válida")
      .nullable()
      .optional(),
    coverUrl: z
      .url("La URL de la portada no es válida")
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

export const updateReelSchema = createReelSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debes enviar al menos un campo para actualizar",
  });

export const reelIdParamsSchema = z.object({
  id: z.coerce
    .number()
    .int("El identificador debe ser un número entero")
    .positive("El identificador debe ser válido"),
});
