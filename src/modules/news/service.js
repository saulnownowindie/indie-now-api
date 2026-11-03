import prisma from "../../config/prisma.js";
import {
  buildPaginatedResponse,
  getPagination,
} from "../../utils/pagination.js";
import { generateUniqueSlug } from "../../utils/slug.js";

const adminNewsInclude = {
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

const publicNewsSelect = {
  id: true,
  title: true,
  slug: true,
  platform: true,
  url: true,
  featured: true,
  seoTitle: true,
  seoDescription: true,
  publishedAt: true,
  homeSection: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
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

export const getAllNews = async (section) => {
  return getPublicNews(section);
};

export const getPublicNews = async (section) => {
  return prisma.news.findMany({
    where: {
      ...publishedWhere,
      ...(section ? { homeSection: section } : {}),
    },
    select: publicNewsSelect,
    orderBy: [
      { sortOrder: "asc" },
      { publishedAt: "desc" },
      { createdAt: "desc" },
    ],
  });
};

export const getNewsBySlug = async (slug) => {
  return prisma.news.findFirst({
    where: {
      slug,
      ...publishedWhere,
    },
    select: {
      ...publicNewsSelect,
      content: true,
    },
  });
};

// Lectura completa para el CMS: solo se expone en /api/admin/news.
export const getAllNewsAdmin = async ({ page = 1, limit = 50 } = {}) => {
  const { skip, take } = getPagination(page, limit);

  const [data, total] = await Promise.all([
    prisma.news.findMany({
      include: adminNewsInclude,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      skip,
      take,
    }),
    prisma.news.count(),
  ]);

  return buildPaginatedResponse(data, total, page, limit);
};

export const createNews = async (data, authorId) => {
  const slug = await getUniqueSlug(data.title);

  return prisma.news.create({
    data: {
      ...data,
      slug,
      authorId,
    },
    include: adminNewsInclude,
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
    include: adminNewsInclude,
  });
};

export const deleteNews = async (id) => {
  return prisma.news.delete({
    where: { id },
  });
};
