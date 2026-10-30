import prisma from "../../config/prisma.js";
import { generateUniqueSlug } from "../../utils/slug.js";

const newsInclude = {
  category: true,
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
    fallback: "news",
    isSlugTaken: async (slug) => {
      const news = await prisma.news.findUnique({
        where: { slug },
        select: { id: true },
      });

      return Boolean(news && news.id !== excludedId);
    },
  });
};

export const getAllNews = async () => {
  return prisma.news.findMany({
    include: newsInclude,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });
};

export const getPublicNews = async () => {
  return prisma.news.findMany({
    where: {
      status: "PUBLISHED",
      isVisible: true,
    },
    include: newsInclude,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });
};

export const getNewsBySlug = async (slug) => {
  return prisma.news.findUnique({
    where: { slug },
    include: newsInclude,
  });
};

export const createNews = async (data, authorId) => {
  const slug = await getUniqueSlug(data.title);

  return prisma.news.create({
    data: {
      ...data,
      slug,
      authorId,
    },
    include: newsInclude,
  });
};

export const updateNews = async (id, data) => {
  const slug = data.title ? await getUniqueSlug(data.title, id) : undefined;

  return prisma.news.update({
    where: { id },
    data: {
      ...data,
      ...(slug && { slug }),
    },
    include: newsInclude,
  });
};

export const deleteNews = async (id) => {
  return prisma.news.delete({
    where: { id },
  });
};
