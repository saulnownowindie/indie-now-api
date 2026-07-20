import { z } from "zod";

export const postSchema = z.object({
  title: z
    .string()
    .min(5, "El título debe tener al menos 5 caracteres")
    .max(150, "El título es demasiado largo"),

  excerpt: z
    .string()
    .min(10)
    .max(300),

  content: z
    .string()
    .min(20),

  coverImage: z
    .string()
    .min(1),

  coverVideo: z
    .string()
    .min(1),

  categoryId: z.number().int().positive(),
});