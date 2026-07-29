import prisma from "../../config/prisma.js";
import {
  extractSpotifyPlaylistId,
  normalizeSpotifyPlaylistUrl,
} from "../../integrations/spotify/parser.js";
import { getSpotifyPlaylistMetadata } from "../../integrations/spotify/provider.js";
import { generateUniqueSlug } from "../../utils/slug.js";

const playlistInclude = {
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
    fallback: "playlist",
    isSlugTaken: async (slug) => {
      const playlist = await prisma.playlist.findUnique({
        where: { slug },
        select: { id: true },
      });

      return Boolean(playlist && playlist.id !== excludedId);
    },
  });
};

const getSpotifyData = async (spotifyUrl) => {
  const spotifyId = extractSpotifyPlaylistId(spotifyUrl);
  const normalizedUrl = normalizeSpotifyPlaylistUrl(spotifyUrl);

  const metadata = await getSpotifyPlaylistMetadata(spotifyId);

  if (metadata.spotifyId !== spotifyId || !normalizedUrl) {
    throw new Error("La playlist recibida desde Spotify no es válida.");
  }

  return {
    ...metadata,
    spotifyUrl: normalizedUrl,
    spotifySyncedAt: new Date(),
  };
};

export const getAllPlaylists = async () => {
  return prisma.playlist.findMany({
    include: playlistInclude,
    orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
  });
};

export const getFeaturedPlaylists = async () => {
  return prisma.playlist.findMany({
    where: {
      featured: true,
      isVisible: true,
      status: "PUBLISHED",
    },
    include: playlistInclude,
    orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
  });
};

export const getPlaylistBySlug = async (slug) => {
  return prisma.playlist.findUnique({
    where: { slug },
    include: playlistInclude,
  });
};

export const createPlaylist = async (data, authorId) => {
  const spotifyData = await getSpotifyData(data.spotifyUrl);
  const slug = await getUniqueSlug(spotifyData.title);

  return prisma.playlist.create({
    data: {
      ...spotifyData,
      slug,
      platform: "SPOTIFY",
      authorId,
    },
    include: playlistInclude,
  });
};

export const updatePlaylist = async (id, data) => {
  return prisma.playlist.update({
    where: { id },
    data,
    include: playlistInclude,
  });
};

export const syncPlaylist = async (id) => {
  const playlist = await prisma.playlist.findUnique({
    where: { id },
    select: { spotifyUrl: true },
  });

  if (!playlist) {
    return null;
  }

  const spotifyData = await getSpotifyData(playlist.spotifyUrl);

  return prisma.playlist.update({
    where: { id },
    data: spotifyData,
    include: playlistInclude,
  });
};

export const deletePlaylist = async (id) => {
  return prisma.playlist.delete({
    where: { id },
  });
};
