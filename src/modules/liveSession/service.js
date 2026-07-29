import prisma from "../../config/prisma.js";
import { generateUniqueSlug } from "../../utils/slug.js";
import { normalizeYouTubeUrl } from "../../utils/youtube.js";

const liveSessionInclude = {
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
    include: liveSessionInclude,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });
};

export const getFeaturedLiveSessions = async () => {
  return prisma.liveSession.findMany({
    where: { featured: true },
    include: liveSessionInclude,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });
};

export const getLiveSessionBySlug = async (slug) => {
  return prisma.liveSession.findUnique({
    where: { slug },
    include: liveSessionInclude,
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
    include: liveSessionInclude,
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
    include: liveSessionInclude,
  });
};

export const deleteLiveSession = async (id) => {
  return prisma.liveSession.delete({
    where: { id },
  });
};
