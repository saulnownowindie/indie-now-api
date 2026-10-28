import { z } from "zod";

const publishStatuses = ["DRAFT", "PUBLISHED"];

const merchDetailSchema = z
  .object({
    label: z
      .string()
      .trim()
      .min(1, "La etiqueta del detalle es obligatoria")
      .max(60, "La etiqueta no puede superar los 60 caracteres"),
    value: z
      .string()
      .trim()
      .min(1, "El valor del detalle es obligatorio")
      .max(120, "El valor no puede superar los 120 caracteres"),
  })
  .strict();

export const createMerchSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "El nombre debe tener al menos 3 caracteres")
      .max(150, "El nombre no puede superar los 150 caracteres"),
    description: z
      .string()
      .trim()
      .max(500, "La descripción no puede superar los 500 caracteres")
      .nullable()
      .optional(),
    collection: z
      .string()
      .trim()
      .max(150, "La colección no puede superar los 150 caracteres")
      .nullable()
      .optional(),
    price: z
      .string()
      .trim()
      .max(50, "El precio no puede superar los 50 caracteres")
      .nullable()
      .optional(),
    details: z.array(merchDetailSchema).max(20).optional(),
    imageUrl: z.url("La URL de la imagen no es válida").nullable().optional(),
    gallery: z.array(z.url("La URL de la galería no es válida")).max(20).optional(),
    badge: z
      .string()
      .trim()
      .max(50, "La etiqueta no puede superar los 50 caracteres")
      .nullable()
      .optional(),
    url: z.url("La URL de compra no es válida").nullable().optional(),
    coverImageId: z.coerce
      .number()
      .int("La portada debe ser un número entero")
      .positive("La portada debe ser válida")
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
    status: z.enum(publishStatuses, {
      message: "El estado seleccionado no es válido",
    }).optional(),
    publishedAt: z.coerce.date().nullable().optional(),
  })
  .strict();

export const updateMerchSchema = createMerchSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debes enviar al menos un campo para actualizar",
  });

export const merchIdParamsSchema = z.object({
  id: z.coerce
    .number()
    .int("El identificador debe ser un número entero")
    .positive("El identificador debe ser válido"),
});
