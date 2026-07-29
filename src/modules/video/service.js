import prisma from "../../config/prisma.js";
import { generateUniqueSlug } from "../../utils/slug.js";
import { normalizeYouTubeUrl } from "../../utils/youtube.js";

const videoInclude = {
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
    include: videoInclude,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });
};

export const getVideoBySlug = async (slug) => {
  return prisma.video.findUnique({
    where: { slug },
    include: videoInclude,
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
    include: videoInclude,
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
    include: videoInclude,
  });
};

export const deleteVideo = async (id) => {
  return prisma.video.delete({
    where: { id },
  });
};
