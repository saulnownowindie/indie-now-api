import prisma from "../../config/prisma.js";
import { generateUniqueSlug } from "../../utils/slug.js";
import { getSocialEmbedUrl } from "../../utils/socialEmbed.js";

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

  const previewUrl = data.previewUrl ?? existing.previewUrl;
  const posterUrl = data.posterUrl ?? existing.posterUrl;

  if (previewUrl && posterUrl) {
    return { previewStatus: "ready", processingAt: null };
  }

  return { previewStatus: null, processingAt: null };
};

export const getAllReels = async () => {
  const reels = await prisma.reel.findMany({
    include: reelInclude,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });

  return reels.map(withEmbed);
};

export const getPublicReels = async (section) => {
  const reels = await prisma.reel.findMany({
    where: {
      status: "PUBLISHED",
      isVisible: true,
      ...(section ? { homeSection: section } : {}),
    },
    include: reelInclude,
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
      featured: true,
      isVisible: true,
      status: "PUBLISHED",
    },
    include: reelInclude,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });

  return reels.map(withEmbed);
};

export const getReelBySlug = async (slug) => {
  const reel = await prisma.reel.findUnique({
    where: { slug },
    include: reelInclude,
  });

  return reel ? withEmbed(reel) : null;
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
    include: reelInclude,
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
    include: reelInclude,
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
    include: reelInclude,
  });

  return withEmbed(updated);
};

export const deleteReel = async (id) => {
  return prisma.reel.delete({
    where: { id },
  });
};
