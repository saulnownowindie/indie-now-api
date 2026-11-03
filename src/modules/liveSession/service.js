import prisma from "../../config/prisma.js";
import { generateUniqueSlug } from "../../utils/slug.js";
import { normalizeYouTubeUrl } from "../../utils/youtube.js";

const adminLiveSessionInclude = {
  coverImage: true,
  author: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
};

const publicLiveSessionSelect = {
  id: true,
  title: true,
  slug: true,
  youtubeUrl: true,
  featured: true,
  seoTitle: true,
  seoDescription: true,
  publishedAt: true,
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

const getUniqueSlug = async (title, excludedId) => {
  return generateUniqueSlug(title, {
    fallback: "indie-now-session",
    isSlugTaken: async (slug) => {
      const liveSession = await prisma.liveSession.findUnique({
        where: { slug },
        select: { id: true },
      });

      return Boolean(liveSession && liveSession.id !== excludedId);
    },
  });
};

export const getAllLiveSessions = async () => {
  return prisma.liveSession.findMany({
    where: publishedWhere,
    select: publicLiveSessionSelect,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });
};

export const getFeaturedLiveSessions = async () => {
  return prisma.liveSession.findMany({
    where: {
      ...publishedWhere,
      featured: true,
    },
    select: publicLiveSessionSelect,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });
};

export const getLiveSessionBySlug = async (slug) => {
  return prisma.liveSession.findFirst({
    where: {
      slug,
      ...publishedWhere,
    },
    select: publicLiveSessionSelect,
  });
};

// Lectura completa para el CMS: solo se expone en /api/admin/live-sessions.
export const getAllLiveSessionsAdmin = async () => {
  return prisma.liveSession.findMany({
    include: adminLiveSessionInclude,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });
};

export const createLiveSession = async (data, authorId) => {
  const slug = await getUniqueSlug(data.title);

  return prisma.liveSession.create({
    data: {
      ...data,
      youtubeUrl: normalizeYouTubeUrl(data.youtubeUrl),
      slug,
      authorId,
    },
    include: adminLiveSessionInclude,
  });
};

export const updateLiveSession = async (id, data) => {
  const slug = data.title ? await getUniqueSlug(data.title, id) : undefined;
  const youtubeUrl = data.youtubeUrl
    ? normalizeYouTubeUrl(data.youtubeUrl)
    : undefined;

  return prisma.liveSession.update({
    where: { id },
    data: {
      ...data,
      ...(slug && { slug }),
      ...(youtubeUrl && { youtubeUrl }),
    },
    include: adminLiveSessionInclude,
  });
};

export const deleteLiveSession = async (id) => {
  return prisma.liveSession.delete({
    where: { id },
  });
};
