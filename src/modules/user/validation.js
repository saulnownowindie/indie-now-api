import { z } from "zod";

export const createUserSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "El nombre es obligatorio")
      .max(150, "El nombre no puede superar los 150 caracteres"),
    email: z
      .string()
      .trim()
      .email("El formato de correo electrónico no es válido"),
    password: z
      .string()
      .min(6, "La contraseña debe tener al menos 6 caracteres")
      .max(100, "La contraseña no puede superar los 100 caracteres"),
    avatarUrl: z
      .string()
      .trim()
      .url("La URL del avatar no es válida")
      .nullable()
      .optional(),
  })
  .strict();
