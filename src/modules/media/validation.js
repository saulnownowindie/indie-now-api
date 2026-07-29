import { z } from "zod";

export const mediaFileSchema = z.object({
  filename: z.string().min(1),
  originalname: z.string().min(1),
  mimetype: z.enum(["image/jpeg", "image/png", "image/webp"]),
  size: z.number().int().positive(),
});
