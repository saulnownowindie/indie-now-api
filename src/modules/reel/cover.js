import prisma from "../../config/prisma.js";
import { uploadBuffer } from "../../utils/cloudinaryUpload.js";
import { detectSocialPlatform } from "../../utils/socialEmbed.js";

const ALLOWED_HOSTS = new Set([
  "youtube.com",
  "m.youtube.com",
  "youtu.be",
  "tiktok.com",
  "www.tiktok.com",
  "m.tiktok.com",
  "vm.tiktok.com",
  "vt.tiktok.com",
  "instagram.com",
  "www.instagram.com",
]);

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const TIMEOUT_MS = 8000;

const USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/131 Safari/537.36";

function httpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;

  return error;
}

function normalizeHost(hostname) {
  return hostname.toLowerCase().replace(/^www\./, "");
}

function isPrivateHost(hostname) {
  const host = hostname.toLowerCase();

  if (
    host === "localhost" ||
    host === "::1" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local")
  ) {
    return true;
  }

  return (
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^0\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  );
}

function parseSocialUrl(value) {
  let url;

  try {
    url = new URL(String(value || "").trim());
  } catch {
    throw httpError("La URL no es válida.");
  }

  if (url.protocol !== "https:") {
    throw httpError("Solo se aceptan enlaces HTTPS.");
  }

  const host = normalizeHost(url.hostname);

  if (!ALLOWED_HOSTS.has(host) && !ALLOWED_HOSTS.has(url.hostname)) {
    throw httpError(
      "Solo se aceptan enlaces de YouTube, TikTok o Instagram.",
    );
  }

  return url;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) {
    throw httpError(
      `No se pudo consultar la plataforma. HTTP ${response.status}.`,
      502,
    );
  }

  return response.json();
}

async function downloadImage(imageUrl) {
  let url;

  try {
    url = new URL(imageUrl);
  } catch {
    throw httpError("La miniatura obtenida no es válida.", 502);
  }

  if (url.protocol !== "https:" || isPrivateHost(url.hostname)) {
    throw httpError("La miniatura apunta a un destino no permitido.", 502);
  }

  const response = await fetch(imageUrl, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "image/*",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) {
    throw httpError(
      `No se pudo descargar la miniatura. HTTP ${response.status}.`,
      502,
    );
  }

  if (response.url && isPrivateHost(new URL(response.url).hostname)) {
    throw httpError("La miniatura apunta a un destino no permitido.", 502);
  }

  const contentType = response.headers.get("content-type") || "";

  if (!contentType.startsWith("image/")) {
    throw httpError("El recurso obtenido no es una imagen.", 502);
  }

  const declaredSize = Number(response.headers.get("content-length") || 0);

  if (declaredSize > MAX_IMAGE_BYTES) {
    throw httpError("La imagen supera los 5 MB.", 413);
  }

  const reader = response.body?.getReader();

  if (!reader) {
    const buffer = Buffer.from(await response.arrayBuffer());

    if (buffer.length > MAX_IMAGE_BYTES) {
      throw httpError("La imagen supera los 5 MB.", 413);
    }

    return { buffer, contentType };
  }

  const chunks = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    total += value.byteLength;

    if (total > MAX_IMAGE_BYTES) {
      await reader.cancel();
      throw httpError("La imagen supera los 5 MB.", 413);
    }

    chunks.push(Buffer.from(value));
  }

  const buffer = Buffer.concat(chunks);

  if (!buffer.length) {
    throw httpError("La imagen obtenida está vacía.", 502);
  }

  return { buffer, contentType };
}

async function getOEmbedThumbnail(socialUrl, platform) {
  if (platform === "INSTAGRAM") {
    return null;
  }

  if (platform === "YOUTUBE") {
    const data = await fetchJson(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(socialUrl)}&format=json`,
    );

    return data.thumbnail_url || null;
  }

  if (platform === "TIKTOK") {
    const data = await fetchJson(
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(socialUrl)}`,
    );

    return data.thumbnail_url || null;
  }

  return null;
}

export async function getCoverFromSocialUrl(value) {
  const socialUrl = parseSocialUrl(value);
  const platform = detectSocialPlatform(socialUrl.toString());

  if (platform === "INSTAGRAM") {
    return { manual: true };
  }

  if (platform !== "YOUTUBE" && platform !== "TIKTOK") {
    throw httpError(
      "Solo se aceptan enlaces de YouTube, TikTok o Instagram.",
    );
  }

  const thumbnailUrl = await getOEmbedThumbnail(
    socialUrl.toString(),
    platform,
  );

  if (!thumbnailUrl) {
    throw httpError(
      "La plataforma no devolvió una miniatura para este enlace.",
      502,
    );
  }

  const { buffer, contentType } = await downloadImage(thumbnailUrl);

  const publicId = `reel-cover-${Date.now()}-${Math.round(
    Math.random() * 1e9,
  )}`;

  let uploaded;

  try {
    uploaded = await uploadBuffer(buffer, {
      folder: "reels-covers",
      public_id: publicId,
    });
  } catch (cause) {
    const error = new Error(
      "No se pudo subir la portada a Cloudinary.",
    );
    error.statusCode = 502;
    error.cause = cause;
    throw error;
  }

  const media = await prisma.media.create({
    data: {
      type: "IMAGE",
      filename: uploaded.public_id,
      originalName: `${publicId}.${uploaded.format || "jpg"}`,
      mimeType: contentType,
      size: buffer.length,
      url: uploaded.secure_url,
    },
  });

  return {
    manual: false,
    coverUrl: uploaded.secure_url,
    media,
  };
}
