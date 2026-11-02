import fetch from "node-fetch";
import { parse } from "node-html-parser";

import prisma from "../../config/prisma.js";
import { deleteAsset, uploadBuffer } from "../../utils/cloudinaryUpload.js";

const FOLDER = "news-covers";
const PAGE_TIMEOUT_MS = 8000;
const IMAGE_TIMEOUT_MS = 20000;
const UPLOAD_TIMEOUT_MS = 20000;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_TITLE_LENGTH = 160;

const USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/131 Safari/537.36";

const INSTAGRAM_HOSTS = new Set([
  "instagram.com",
  "www.instagram.com",
  "m.instagram.com",
]);

const TIKTOK_HOSTS = new Set([
  "tiktok.com",
  "www.tiktok.com",
  "m.tiktok.com",
  "vm.tiktok.com",
  "vt.tiktok.com",
]);

const DIRECT_IMAGE_PATTERN = /\.(?:avif|bmp|gif|jpe?g|png|svg|tiff?|webp)$/i;

const OG_IMAGE_SELECTORS = [
  'meta[property="og:image"]',
  'meta[property="og:image:secure_url"]',
  'meta[name="twitter:image"]',
  'meta[property="twitter:image"]',
];

const OG_TITLE_SELECTORS = [
  'meta[property="og:title"]',
  'meta[name="twitter:title"]',
];

const OG_DESCRIPTION_SELECTORS = [
  'meta[property="og:description"]',
  'meta[name="description"]',
  'meta[name="twitter:description"]',
];

const HTML_ENTITIES = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  quot: '"',
};

function sanitizeTitle(title) {
  return String(title ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_TITLE_LENGTH);
}

function decodeHtmlEntities(value) {
  return String(value ?? "")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      safeCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, decimal) =>
      safeCodePoint(Number.parseInt(decimal, 10)),
    )
    .replace(/&([a-z]+);/gi, (match, name) => {
      return HTML_ENTITIES[name.toLowerCase()] ?? match;
    });
}

function safeCodePoint(code) {
  try {
    return String.fromCodePoint(code);
  } catch {
    return "";
  }
}

function cleanSocialText(value) {
  return decodeHtmlEntities(value)
    .replace(/\u00a0/g, " ")
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/\bwww\.\S+/gi, " ")
    .replace(/@[\w.]+/g, " ")
    .replace(/#([\p{L}\p{N}_]+)/gu, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function firstLine(value) {
  return (
    String(value ?? "")
      .split(/\r?\n|\u2028|\u2029/)
      .map((line) => line.trim())
      .find(Boolean) || ""
  );
}

function extractQuotedText(value) {
  const match = String(value ?? "").match(/[“"]([^“”"]{3,})[”"]/);

  return match ? match[1].trim() : "";
}

function stripDescriptionPrefix(value) {
  return value
    .replace(/^[\d.,KMB]+\s*(?:likes?|me gusta)\b[^:]*:\s*/i, "")
    .replace(
      /^.*?\b(?:on|en)\s+(?:instagram|tiktok|twitter|x|facebook|threads)\b[^:]*:\s*/i,
      "",
    )
    .replace(/^.*?\bon\s+[A-Za-z]+\s+\d{1,2},?\s+\d{4}\s*:\s*/, "")
    .trim();
}

function cleanTitleCandidate(value, { keepHashtags = false } = {}) {
  const source = keepHashtags
    ? value
    : String(value ?? "").replace(/#[\p{L}\p{N}_]+/gu, " ");

  return cleanSocialText(source)
    .replace(
      /^.*?\b(?:on|en)\s+(?:instagram|tiktok|twitter|x|facebook|threads)\b\s*:\s*/i,
      "",
    )
    .replace(
      /\s*[|•]\s*(?:instagram|tiktok|twitter|x|facebook|threads)\b.*$/i,
      "",
    )
    .replace(
      /\s*[-–—]\s*(?:instagram|tiktok|twitter|x|facebook|threads)\b.*$/i,
      "",
    )
    .replace(/\s*[|•]\s*(?:photos? and videos?|make your day)\b.*$/i, "")
    .replace(/^(?:watch|mira)\s+/i, "")
    .replace(/\b(?:the\s+)?latest\s+video\s+from\b/gi, " ")
    .replace(/\s*\(@[\w.]+\)\s*/g, " ")
    .replace(/\(\s*\)/g, " ")
    .replace(/^["“”']+|["“”']+$/g, "")
    .replace(/[\s.,;:!?-]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isGenericTitle(value) {
  const text = String(value ?? "").trim();

  if (!text || !/[\p{L}\p{N}]/u.test(text)) {
    return true;
  }

  return (
    /^(instagram|tiktok|twitter|x|facebook|threads)$/i.test(text) ||
    /instagram photos and videos|see instagram|photos and videos from|make your day|log in|sign up|iniciar sesión|crear cuenta/i.test(
      text,
    )
  );
}

function truncateSuggestedTitle(value) {
  const safeValue = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

  if (safeValue.length <= MAX_TITLE_LENGTH) {
    return safeValue;
  }

  const cut = safeValue.slice(0, MAX_TITLE_LENGTH);
  const lastSpace = cut.lastIndexOf(" ");

  return (lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trim();
}

function extractDescriptionCandidate(value) {
  const line = firstLine(value);

  if (!line) {
    return "";
  }

  const cleaned = cleanSocialText(line.replace(/#[\p{L}\p{N}_]+/gu, " "));
  const quoted = extractQuotedText(cleaned);
  const candidate = quoted || stripDescriptionPrefix(cleaned);

  return cleanTitleCandidate(candidate);
}

function buildSuggestedTitle(metadata) {
  if (!metadata) {
    return null;
  }

  const rawTitle = cleanTitleCandidate(
    extractQuotedText(metadata.title) || metadata.title,
  );

  if (rawTitle && !isGenericTitle(rawTitle)) {
    return truncateSuggestedTitle(rawTitle);
  }

  const rawDescription = extractDescriptionCandidate(metadata.description);

  if (rawDescription && !isGenericTitle(rawDescription)) {
    return truncateSuggestedTitle(rawDescription);
  }

  return null;
}

function getSocialSource(value) {
  try {
    const hostname = new URL(value).hostname.toLowerCase();

    if (INSTAGRAM_HOSTS.has(hostname)) {
      return "instagram";
    }

    if (TIKTOK_HOSTS.has(hostname)) {
      return "tiktok";
    }

    return null;
  } catch {
    return null;
  }
}

function isDirectImageUrl(value) {
  try {
    const url = new URL(value);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return false;
    }

    return DIRECT_IMAGE_PATTERN.test(url.pathname);
  } catch {
    return false;
  }
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

function isAllowedRemoteUrl(value) {
  try {
    const url = new URL(value);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return false;
    }

    return !isPrivateHost(url.hostname);
  } catch {
    return false;
  }
}

function withTimeout(promise, timeoutMs, message) {
  let timer;

  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function fetchWithTimeout(url, options = {}, timeoutMs = PAGE_TIMEOUT_MS) {
  return fetch(url, {
    redirect: "follow",
    ...options,
    signal: AbortSignal.timeout(timeoutMs),
  });
}

function getMetaContent(root, selectors) {
  for (const selector of selectors) {
    const raw = root.querySelector(selector)?.getAttribute("content");
    const value = decodeHtmlEntities(raw).trim();

    if (value) {
      return value;
    }
  }

  return null;
}

async function extractPageMetadata(pageUrl) {
  if (!isAllowedRemoteUrl(pageUrl)) {
    return null;
  }

  try {
    const response = await fetchWithTimeout(
      pageUrl,
      {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
        },
      },
      PAGE_TIMEOUT_MS,
    );

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get("content-type") || "";

    if (contentType && !contentType.includes("text/html")) {
      return null;
    }

    const root = parse(await response.text());
    const imageContent = getMetaContent(root, OG_IMAGE_SELECTORS);
    let imageUrl = null;

    if (imageContent) {
      try {
        const resolved = new URL(imageContent, pageUrl).toString();

        // Instagram suele devolver su logo estático cuando bloquea el scraping.
        if (
          !resolved.includes("instagram.com/static") &&
          isAllowedRemoteUrl(resolved)
        ) {
          imageUrl = resolved;
        }
      } catch {
        imageUrl = null;
      }
    }

    return {
      imageUrl,
      title: getMetaContent(root, OG_TITLE_SELECTORS),
      description: getMetaContent(root, OG_DESCRIPTION_SELECTORS),
    };
  } catch (error) {
    console.warn(
      `[image-search] No se pudo extraer la información de ${pageUrl}: ${error.message}`,
    );

    return null;
  }
}

async function downloadImage(imageUrl) {
  const response = await fetchWithTimeout(
    imageUrl,
    {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "image/*",
      },
    },
    IMAGE_TIMEOUT_MS,
  );

  if (!response.ok) {
    throw new Error(`la descarga respondió HTTP ${response.status}`);
  }

  const contentType = (response.headers.get("content-type") || "image/jpeg")
    .split(";")[0]
    .trim();

  if (!contentType.startsWith("image/")) {
    throw new Error(`el recurso no es una imagen (${contentType})`);
  }

  const declaredSize = Number(response.headers.get("content-length") || 0);

  if (declaredSize > MAX_IMAGE_BYTES) {
    throw new Error("la imagen supera el tamaño máximo permitido");
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  if (!buffer.length) {
    throw new Error("la imagen descargada está vacía");
  }

  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new Error("la imagen supera el tamaño máximo permitido");
  }

  return { buffer, contentType };
}

async function persistImage(imageUrl, title, source) {
  if (!isAllowedRemoteUrl(imageUrl)) {
    throw new Error("la URL de la imagen no es válida");
  }

  const { buffer, contentType } = await downloadImage(imageUrl);
  const extension =
    contentType.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
  const publicId = `news-${source}-${Date.now()}-${Math.round(
    Math.random() * 1e9,
  )}`;

  let uploaded;

  try {
    uploaded = await withTimeout(
      uploadBuffer(buffer, {
        folder: FOLDER,
        public_id: publicId,
        timeout: UPLOAD_TIMEOUT_MS,
      }),
      UPLOAD_TIMEOUT_MS + 2000,
      "Cloudinary tardó demasiado en responder",
    );
  } catch (cause) {
    const error = new Error("No se pudo subir la imagen a Cloudinary");
    error.cause = cause;

    throw error;
  }

  try {
    return await prisma.media.create({
      data: {
        type: "IMAGE",
        filename: uploaded.public_id,
        originalName: `${title.slice(0, 60)}.${uploaded.format || extension}`,
        mimeType: contentType,
        size: buffer.length,
        url: uploaded.secure_url,
      },
    });
  } catch (error) {
    // Si Prisma falla, evitamos dejar un asset huérfano en Cloudinary.
    try {
      await deleteAsset(uploaded.public_id);
    } catch (cleanupError) {
      console.error(
        `[image-search] No se pudo limpiar el asset huérfano: ${cleanupError.message}`,
      );
    }

    throw error;
  }
}

async function tryPersistCandidate(candidate, title) {
  if (!candidate?.url) {
    return null;
  }

  try {
    const media = await persistImage(candidate.url, title, candidate.source);

    return {
      url: media.url,
      mediaId: media.id,
      source: candidate.source,
    };
  } catch (error) {
    console.warn(
      `[image-search] No se pudo guardar la imagen de ${candidate.source}: ${error.message}`,
    );

    return null;
  }
}

export async function findBestImage(title, url) {
  const safeTitle = sanitizeTitle(title);

  if (!url) {
    return null;
  }

  // Estrategia 1: la URL ya apunta directamente a una imagen.
  if (isDirectImageUrl(url)) {
    const result = await tryPersistCandidate(
      { url, source: "direct" },
      safeTitle || "imagen",
    );

    return result ? { ...result, suggestedTitle: null } : null;
  }

  // Estrategia 2: enlaces de Instagram/TikTok, intentamos leer su og:image.
  const socialSource = getSocialSource(url);

  if (!socialSource) {
    return null;
  }

  let metadata = null;

  try {
    metadata = await extractPageMetadata(url);
  } catch (error) {
    console.warn(
      `[image-search] Falló la extracción de la imagen original: ${error.message}`,
    );
  }

  if (!metadata?.imageUrl) {
    return null;
  }

  const suggestedTitle = buildSuggestedTitle(metadata);
  const result = await tryPersistCandidate(
    { url: metadata.imageUrl, source: socialSource },
    suggestedTitle || safeTitle || "indie music",
  );

  return result ? { ...result, suggestedTitle } : null;
}
