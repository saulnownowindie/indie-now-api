import prisma from "../../config/prisma.js";
import { generateUniqueSlug } from "../../utils/slug.js";

const adminMerchInclude = {
  coverImage: true,
  author: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
};

const publicMerchSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  collection: true,
  price: true,
  details: true,
  imageUrl: true,
  gallery: true,
  badge: true,
  url: true,
  featured: true,
  sortOrder: true,
  seoTitle: true,
  seoDescription: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  icon: true,
  coverImage: {
    select: {
      id: true,
      url: true,
    },
  },
  author: {
    select: {
      id: true,
      name: true,
      avatarUrl: true,
    },
  },
};

const publishedWhere = {
  status: "PUBLISHED",
  isVisible: true,
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
    where: publishedWhere,
    select: publicMerchSelect,
    orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
  });
};

export const getFeaturedMerch = async () => {
  return prisma.merch.findMany({
    where: {
      ...publishedWhere,
      featured: true,
    },
    select: publicMerchSelect,
    orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
  });
};

export const getMerchBySlug = async (slug) => {
  return prisma.merch.findFirst({
    where: {
      slug,
      ...publishedWhere,
    },
    select: publicMerchSelect,
  });
};

// Lectura completa para el CMS: solo se expone en /api/admin/merch.
export const getAllMerchAdmin = async () => {
  return prisma.merch.findMany({
    include: adminMerchInclude,
    orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
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
    include: adminMerchInclude,
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
    include: adminMerchInclude,
  });
};

export const deleteMerch = async (id) => {
  return prisma.merch.delete({
    where: { id },
  });
};
