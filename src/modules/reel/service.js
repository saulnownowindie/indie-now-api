import prisma from "../../config/prisma.js";
import {
  buildPaginatedResponse,
  getPagination,
} from "../../utils/pagination.js";
import { generateUniqueSlug } from "../../utils/slug.js";
import { getSocialEmbedUrl } from "../../utils/socialEmbed.js";

const adminReelInclude = {
  coverImage: true,
  author: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
};

const publicReelSelect = {
  id: true,
  title: true,
  slug: true,
  platform: true,
  url: true,
  videoUrl: true,
  previewUrl: true,
  posterUrl: true,
  previewStart: true,
  coverUrl: true,
  featured: true,
  seoTitle: true,
  seoDescription: true,
  publishedAt: true,
  homeSection: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
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

const withEmbed = (reel) => ({
  ...reel,
  embedUrl: getSocialEmbedUrl(reel.url, reel.platform),
});

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

const withPreviewStatus = (data, existing = {}) => {
  if (!("previewUrl" in data) && !("posterUrl" in data)) {
    return {};
  }

  const current = existing || {};
  const previewUrl = data.previewUrl ?? current.previewUrl;
  const posterUrl = data.posterUrl ?? current.posterUrl;

  if (previewUrl && posterUrl) {
    return { previewStatus: "ready", processingAt: null };
  }

  return { previewStatus: null, processingAt: null };
};

export const getAllReels = async (section) => {
  return getPublicReels(section);
};

export const getPublicReels = async (section) => {
  const reels = await prisma.reel.findMany({
    where: {
      ...publishedWhere,
      ...(section ? { homeSection: section } : {}),
    },
    select: publicReelSelect,
    orderBy: [
      { sortOrder: "asc" },
      { publishedAt: "desc" },
      { createdAt: "desc" },
    ],
  });

  return reels.map(withEmbed);
};

export const getFeaturedReels = async () => {
  const reels = await prisma.reel.findMany({
    where: {
      ...publishedWhere,
      featured: true,
    },
    select: publicReelSelect,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });

  return reels.map(withEmbed);
};

export const getReelBySlug = async (slug) => {
  const reel = await prisma.reel.findFirst({
    where: {
      slug,
      ...publishedWhere,
    },
    select: publicReelSelect,
  });

  return reel ? withEmbed(reel) : null;
};

// Lectura completa para el CMS: solo se expone en /api/admin/reels.
export const getAllReelsAdmin = async ({ page = 1, limit = 50 } = {}) => {
  const { skip, take } = getPagination(page, limit);

  const [data, total] = await Promise.all([
    prisma.reel.findMany({
      include: adminReelInclude,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      skip,
      take,
    }),
    prisma.reel.count(),
  ]);

  return buildPaginatedResponse(data.map(withEmbed), total, page, limit);
};

export const createReel = async (data, authorId) => {
  const slug = await getUniqueSlug(data.title);

  const reel = await prisma.reel.create({
    data: {
      ...data,
      ...withPreviewStatus(data),
      slug,
      authorId,
    },
    include: adminReelInclude,
  });

  return withEmbed(reel);
};

export const updateReel = async (id, data) => {
  const slug = data.title ? await getUniqueSlug(data.title, id) : undefined;

  const existing =
    "previewUrl" in data || "posterUrl" in data
      ? await prisma.reel.findUnique({
          where: { id },
          select: { previewUrl: true, posterUrl: true },
        })
      : null;

  const reel = await prisma.reel.update({
    where: { id },
    data: {
      ...data,
      ...withPreviewStatus(data, existing),
      ...(slug && { slug }),
    },
    include: adminReelInclude,
  });

  return withEmbed(reel);
};

export const requestReelPreview = async (
  id,
  { previewStart = 1, regenerate = false } = {},
) => {
  const reel = await prisma.reel.findUnique({
    where: { id },
    select: { id: true, url: true, previewUrl: true },
  });

  if (!reel) {
    const error = new Error("Reel no encontrado.");
    error.statusCode = 404;
    throw error;
  }

  if (!reel.url) {
    const error = new Error(
      "El reel no tiene un enlace para procesar.",
    );
    error.statusCode = 400;
    throw error;
  }

  if (reel.previewUrl && !regenerate) {
    const error = new Error(
      "El reel ya tiene un preview. Usa regenerate para rehacerlo.",
    );
    error.statusCode = 409;
    throw error;
  }

  const updated = await prisma.reel.update({
    where: { id },
    data: {
      previewStart,
      previewStatus: "pending",
      processingAt: null,
    },
    include: adminReelInclude,
  });

  return withEmbed(updated);
};

export const deleteReel = async (id) => {
  return prisma.reel.delete({
    where: { id },
  });
};
