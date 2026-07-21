import prisma from "../config/prisma.js";
import { generateSlug } from "../utils/slug.js";

export const getAllCategories = async () => {
  return prisma.category.findMany({
    orderBy: {
      name: "asc",
    },
  });
};

export const getCategoryBySlug = async (slug) => {
  return prisma.category.findUnique({
    where: {
      slug,
    },
  });
};

export const createCategory = async (data) => {
  return prisma.category.create({
    data: {
      ...data,
      slug: generateSlug(data.name),
    },
  });
};
export const updateCategory = async (id, data) => {
  return prisma.category.update({
    where: {
      id: Number(id),
    },
    data: {
      ...data,
      slug: generateSlug(data.name),
    },
  });
};

export const deleteCategory = async (id) => {
  return prisma.category.delete({
    where: {
      id: Number(id),
    },
  });
};