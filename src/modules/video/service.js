import prisma from "../../config/prisma.js";
import { generateUniqueSlug } from "../../utils/slug.js";
import { normalizeYouTubeUrl } from "../../utils/youtube.js";

const adminVideoInclude = {
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

const publicVideoSelect = {
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
    fallback: "video",
    isSlugTaken: async (slug) => {
      const video = await prisma.video.findUnique({
        where: { slug },
        select: { id: true },
      });

      return Boolean(video && video.id !== excludedId);
    },
  });
};

export const getAllVideos = async () => {
  return prisma.video.findMany({
    where: publishedWhere,
    select: publicVideoSelect,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });
};

export const getVideoBySlug = async (slug) => {
  return prisma.video.findFirst({
    where: {
      slug,
      ...publishedWhere,
    },
    select: publicVideoSelect,
  });
};

// Lectura completa para el CMS: solo se expone en /api/admin/videos.
export const getAllVideosAdmin = async () => {
  return prisma.video.findMany({
    include: adminVideoInclude,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });
};

export const createVideo = async (data, authorId) => {
  const slug = await getUniqueSlug(data.title);

  return prisma.video.create({
    data: {
      ...data,
      youtubeUrl: normalizeYouTubeUrl(data.youtubeUrl),
      slug,
      authorId,
    },
    include: adminVideoInclude,
  });
};

export const updateVideo = async (id, data) => {
  const slug = data.title ? await getUniqueSlug(data.title, id) : undefined;
  const youtubeUrl = data.youtubeUrl
    ? normalizeYouTubeUrl(data.youtubeUrl)
    : undefined;

  return prisma.video.update({
    where: { id },
    data: {
      ...data,
      ...(slug && { slug }),
      ...(youtubeUrl && { youtubeUrl }),
    },
    include: adminVideoInclude,
  });
};

export const deleteVideo = async (id) => {
  return prisma.video.delete({
    where: { id },
  });
};
