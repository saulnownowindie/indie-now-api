import { createInstagramCover } from "../news/instagram.js";
import { createMediaFromRemoteImage } from "../../utils/remoteImage.js";
import {
  detectSocialPlatform,
  getSocialEmbedUrl,
} from "../../utils/socialEmbed.js";
import { extractYouTubeVideoId } from "../../utils/youtube.js";

function httpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;

  return error;
}

async function createYouTubeCover(value) {
  const videoId = extractYouTubeVideoId(value);

  if (!videoId) {
    throw httpError("La URL de YouTube no es válida.", 400);
  }

  const thumbnails = [
    `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
  ];

  for (const thumbnail of thumbnails) {
    try {
      return await createMediaFromRemoteImage(thumbnail, {
        folder: "covers",
        prefix: `youtube-${videoId}`,
      });
    } catch {
      // Probamos la siguiente resolución disponible.
    }
  }

  throw httpError(
    "No se pudo obtener la portada de YouTube.",
    502,
  );
}

async function createTikTokCover(value) {
  const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(
    value,
  )}`;

  const response = await fetch(oembedUrl, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw httpError(
      `TikTok respondió con HTTP ${response.status}.`,
      502,
    );
  }

  const data = await response.json();
  const thumbnail = data?.thumbnail_url;

  if (!thumbnail) {
    throw httpError(
      "TikTok no devolvió una miniatura para este video.",
      502,
    );
  }

  return createMediaFromRemoteImage(thumbnail, {
    folder: "covers",
    prefix: "tiktok",
  });
}

export async function extractCover(value) {
  const platform = detectSocialPlatform(value);

  if (!platform) {
    throw httpError(
      "La URL no pertenece a YouTube, Instagram ni TikTok.",
      400,
    );
  }

  const embedUrl = getSocialEmbedUrl(value, platform);

  if (platform === "YOUTUBE") {
    return {
      platform,
      embedUrl,
      media: await createYouTubeCover(value),
    };
  }

  if (platform === "TIKTOK") {
    return {
      platform,
      embedUrl,
      media: await createTikTokCover(value),
    };
  }

  try {
    return {
      platform,
      embedUrl,
      media: await createInstagramCover(value),
    };
  } catch (error) {
    throw httpError(
      error.message || "No se pudo obtener la portada de Instagram.",
      502,
    );
  }
}
