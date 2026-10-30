import { z } from "zod";
import { isValidSpotifyPlaylistUrl } from "../../integrations/spotify/parser.js";

const publishStatuses = ["DRAFT", "PUBLISHED"];

const playlistPlatforms = ["SPOTIFY", "YOUTUBE_MUSIC", "TIKTOK"];

const manualPlaylistSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(2, "El título debe tener al menos 2 caracteres")
      .max(150, "El título no puede superar los 150 caracteres"),
    platform: z.enum(playlistPlatforms, {
      message: "La plataforma seleccionada no es válida",
    }),
    url: z.url("La URL de la playlist no es válida"),
    coverUrl: z
      .url("La URL de la portada no es válida")
      .nullable()
      .optional(),
    description: z
      .string()
      .trim()
      .max(1000, "La descripción no puede superar los 1000 caracteres")
      .nullable()
      .optional(),
    ownerName: z
      .string()
      .trim()
      .max(150, "El nombre del creador no puede superar los 150 caracteres")
      .nullable()
      .optional(),
    tracksCount: z.coerce
      .number()
      .int("La cantidad de canciones debe ser un número entero")
      .min(0, "La cantidad de canciones no puede ser negativa")
      .nullable()
      .optional(),
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
    status: z
      .enum(publishStatuses, {
        message: "El estado seleccionado no es válido",
      })
      .optional(),
    publishedAt: z.coerce.date().nullable().optional(),
  })
  .strict();

const createSpotifyPlaylistSchema = z
  .object({
    spotifyUrl: z
      .url("La URL no es válida")
      .refine(isValidSpotifyPlaylistUrl, {
        message: "La URL debe pertenecer a una playlist de Spotify válida",
      }),
  })
  .strict();

export const createPlaylistSchema = z.union([
  manualPlaylistSchema,
  createSpotifyPlaylistSchema,
]);

export const updatePlaylistSchema = manualPlaylistSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debes enviar al menos un campo para actualizar",
  });

export const playlistIdParamsSchema = z.object({
  id: z.coerce
    .number()
    .int("El identificador debe ser un número entero")
    .positive("El identificador debe ser válido"),
});
