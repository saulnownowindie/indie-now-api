import { z } from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce
    .number()
    .int("La página debe ser un número entero")
    .min(1, "La página debe ser mayor o igual a 1")
    .default(1),
  limit: z.coerce
    .number()
    .int("El límite debe ser un número entero")
    .min(1, "El límite debe ser mayor o igual a 1")
    .max(50, "El límite no puede superar los 50 elementos")
    .default(50),
});

export const getPagination = (page, limit) => ({
  skip: (page - 1) * limit,
  take: limit,
});

export const buildPaginatedResponse = (data, total, page, limit) => ({
  data,
  pagination: {
    page,
    limit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  },
});
