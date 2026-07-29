import { z } from "zod";
import { isValidSpotifyPlaylistUrl } from "../../integrations/spotify/parser.js";

const publishStatuses = ["DRAFT", "PUBLISHED"];

export const createPlaylistSchema = z
  .object({
    spotifyUrl: z
      .url("La URL no es válida")
      .refine(isValidSpotifyPlaylistUrl, {
        message: "La URL debe pertenecer a una playlist de Spotify válida",
      }),
  })
  .strict();

export const updatePlaylistSchema = z
  .object({
    featured: z.boolean().optional(),
    isVisible: z.boolean().optional(),
    sortOrder: z.coerce
      .number()
      .int("El orden debe ser un número entero")
      .min(0, "El orden no puede ser negativo")
      .optional(),
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
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debes enviar al menos un campo para actualizar",
  });

export const playlistIdParamsSchema = z.object({
  id: z.coerce
    .number()
    .int("El identificador debe ser un número entero")
    .positive("El identificador debe ser válido"),
});
