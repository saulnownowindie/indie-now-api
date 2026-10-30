import { z } from "zod";

import {
  claimPendingPreviews,
  completePreview,
} from "./service.js";

const pendingQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(10)
    .default(5),
});

const completePreviewSchema = z
  .object({
    previewUrl: z.url("La URL del preview no es válida").optional(),
    posterUrl: z.url("La URL del poster no es válida").optional(),
    status: z.enum(["ready", "failed"], {
      message: "El estado debe ser ready o failed.",
    }),
  })
  .strict();

const previewIdParamsSchema = z.object({
  id: z.coerce
    .number()
    .int("El identificador debe ser un número entero")
    .positive("El identificador debe ser válido"),
});

export const getPendingPreviews = async (req, res, next) => {
  try {
    const { limit } = pendingQuerySchema.parse(req.query);
    const reels = await claimPendingPreviews(limit);

    res.json({
      count: reels.length,
      reels,
    });
  } catch (error) {
    next(error);
  }
};

export const patchReelPreview = async (req, res, next) => {
  try {
    const { id } = previewIdParamsSchema.parse(req.params);
    const data = completePreviewSchema.parse(req.body);
    const reel = await completePreview(id, data);

    res.json(reel);
  } catch (error) {
    next(error);
  }
};
