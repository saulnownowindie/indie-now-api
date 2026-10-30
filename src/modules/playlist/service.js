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
  if (!data.spotifyUrl) {
    const title = data.title?.trim();
    const slug = await getUniqueSlug(title);
    const status = data.status ?? "DRAFT";

    return prisma.playlist.create({
      data: {
        title,
        slug,
        platform: data.platform,
        url: data.url,
        coverUrl: data.coverUrl ?? null,
        description: data.description ?? null,
        ownerName: data.ownerName ?? null,
        tracksCount: data.tracksCount ?? null,
        featured: data.featured ?? false,
        isVisible: data.isVisible ?? true,
        seoTitle: data.seoTitle ?? null,
        seoDescription: data.seoDescription ?? null,
        sortOrder: data.sortOrder ?? 0,
        status,
        publishedAt:
          data.publishedAt ??
          (status === "PUBLISHED" ? new Date() : null),
        authorId,
      },
      include: playlistInclude,
    });
  }

  const spotifyData = await getSpotifyData(data.spotifyUrl);
  const slug = await getUniqueSlug(spotifyData.title);

  return prisma.playlist.create({
    data: {
      ...spotifyData,
      url: spotifyData.spotifyUrl,
      slug,
      platform: "SPOTIFY",
      authorId,
    },
    include: playlistInclude,
  });
};

export const updatePlaylist = async (id, data) => {
  const payload = { ...data };

  if (payload.status === "PUBLISHED" && payload.publishedAt === undefined) {
    const existing = await prisma.playlist.findUnique({
      where: { id },
      select: { publishedAt: true },
    });

    if (!existing?.publishedAt) {
      payload.publishedAt = new Date();
    }
  }

  return prisma.playlist.update({
    where: { id },
    data: payload,
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

  if (!playlist.spotifyUrl) {
    const error = new Error(
      "Solo las playlists de Spotify se pueden sincronizar.",
    );
    error.statusCode = 400;
    throw error;
  }

  const spotifyData = await getSpotifyData(playlist.spotifyUrl);

  return prisma.playlist.update({
    where: { id },
    data: {
      ...spotifyData,
      url: spotifyData.spotifyUrl,
    },
    include: playlistInclude,
  });
};

export const deletePlaylist = async (id) => {
  return prisma.playlist.delete({
    where: { id },
  });
};
