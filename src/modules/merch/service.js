import prisma from "../../config/prisma.js";
import { generateUniqueSlug } from "../../utils/slug.js";

const merchInclude = {
  coverImage: true,
  author: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
};

const getUniqueSlug = async (name, excludedId) => {
  return generateUniqueSlug(name, {
    fallback: "merch",
    isSlugTaken: async (slug) => {
      const merch = await prisma.merch.findUnique({
        where: { slug },
        select: { id: true },
      });

      return Boolean(merch && merch.id !== excludedId);
    },
  });
};

export const getAllMerch = async () => {
  return prisma.merch.findMany({
    include: merchInclude,
    orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
  });
};

export const getFeaturedMerch = async () => {
  return prisma.merch.findMany({
    where: {
      featured: true,
      isVisible: true,
      status: "PUBLISHED",
    },
    include: merchInclude,
    orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
  });
};

export const getMerchBySlug = async (slug) => {
  return prisma.merch.findUnique({
    where: { slug },
    include: merchInclude,
  });
};

export const createMerch = async (data, authorId) => {
  const slug = await getUniqueSlug(data.name);

  return prisma.merch.create({
    data: {
      ...data,
      slug,
      authorId,
    },
    include: merchInclude,
  });
};

export const updateMerch = async (id, data) => {
  const slug = data.name ? await getUniqueSlug(data.name, id) : undefined;

  return prisma.merch.update({
    where: { id },
    data: {
      ...data,
      ...(slug && { slug }),
    },
    include: merchInclude,
  });
};

export const deleteMerch = async (id) => {
  return prisma.merch.delete({
    where: { id },
  });
};
