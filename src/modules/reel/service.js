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
      slug,
      authorId,
    },
    include: reelInclude,
  });

  return withEmbed(reel);
};

export const updateReel = async (id, data) => {
  const slug = data.title ? await getUniqueSlug(data.title, id) : undefined;

  const reel = await prisma.reel.update({
    where: { id },
    data: {
      ...data,
      ...(slug && { slug }),
    },
    include: reelInclude,
  });

  return withEmbed(reel);
};

export const deleteReel = async (id) => {
  return prisma.reel.delete({
    where: { id },
  });
};
