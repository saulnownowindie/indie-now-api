import prisma from "../../config/prisma.js";
import { generateUniqueSlug } from "../../utils/slug.js";

const reelInclude = {
  coverImage: true,
  author: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
};

const getUniqueSlug = async (title, excludedId) => {
  return generateUniqueSlug(title, {
    fallback: "reel",
    isSlugTaken: async (slug) => {
      const reel = await prisma.reel.findUnique({
        where: { slug },
        select: { id: true },
      });

      return Boolean(reel && reel.id !== excludedId);
    },
  });
};

export const getAllReels = async () => {
  return prisma.reel.findMany({
    include: reelInclude,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });
};

export const getFeaturedReels = async () => {
  return prisma.reel.findMany({
    where: {
      featured: true,
      isVisible: true,
      status: "PUBLISHED",
    },
    include: reelInclude,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });
};

export const getReelBySlug = async (slug) => {
  return prisma.reel.findUnique({
    where: { slug },
    include: reelInclude,
  });
};

export const createReel = async (data, authorId) => {
  const slug = await getUniqueSlug(data.title);

  return prisma.reel.create({
    data: {
      ...data,
      slug,
      authorId,
    },
    include: reelInclude,
  });
};

export const updateReel = async (id, data) => {
  const slug = data.title ? await getUniqueSlug(data.title, id) : undefined;

  return prisma.reel.update({
    where: { id },
    data: {
      ...data,
      ...(slug && { slug }),
    },
    include: reelInclude,
  });
};

export const deleteReel = async (id) => {
  return prisma.reel.delete({
    where: { id },
  });
};
