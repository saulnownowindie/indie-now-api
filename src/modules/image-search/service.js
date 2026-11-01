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
const MAX_CONTEXT_LENGTH = 240;

const USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/131 Safari/537.36";

const INSTAGRAM_HOSTS = new Set(["instagram.com", "www.instagram.com"]);

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
  const rawDescription = extractDescriptionCandidate(metadata.description);
  const title = rawTitle && !isGenericTitle(rawTitle) ? rawTitle : "";
  const description =
    rawDescription && !isGenericTitle(rawDescription) ? rawDescription : "";

  if (!title && !description) {
    return null;
  }

  if (title && description) {
    const titleWords = title.split(/\s+/).length;

    // En Instagram el og:title suele ser solo el nombre de la cuenta,
    // mientras que la descripción contiene el texto real de la publicación.
    if (
      (titleWords <= 2 && description.length > title.length + 5) ||
      (description.length > 24 && description.length > title.length * 2)
    ) {
      return truncateSuggestedTitle(description);
    }

    return truncateSuggestedTitle(title);
  }

  return truncateSuggestedTitle(title || description);
}

function cleanContextText(value, { isTitle = false } = {}) {
  if (isTitle) {
    return cleanTitleCandidate(extractQuotedText(value) || value, {
      keepHashtags: true,
    });
  }

  const cleaned = cleanSocialText(value);
  const candidate = extractQuotedText(cleaned) || stripDescriptionPrefix(cleaned);

  return cleanTitleCandidate(candidate, { keepHashtags: true });
}

function buildContextQuery(metadata) {
  if (!metadata) {
    return "";
  }

  const parts = [
    cleanContextText(metadata.description),
    cleanContextText(metadata.title, { isTitle: true }),
  ].filter((part) => part && !isGenericTitle(part));
  const uniqueParts = [];

  for (const part of parts) {
    const normalized = part.toLowerCase();
    const duplicated = uniqueParts.some((existing) => {
      const normalizedExisting = existing.toLowerCase();

      return (
        normalizedExisting.includes(normalized) ||
        normalized.includes(normalizedExisting)
      );
    });

    if (!duplicated) {
      uniqueParts.push(part);
    }
  }

  return String(uniqueParts.join(" "))
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_CONTEXT_LENGTH);
}

function isInstagramUrl(value) {
  try {
    const hostname = new URL(value).hostname.toLowerCase();

    return INSTAGRAM_HOSTS.has(hostname);
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

async function searchUnsplash(query) {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;

  if (!accessKey || !query) {
    return null;
  }

  try {
    const url = new URL("https://api.unsplash.com/search/photos");
    url.searchParams.set("query", query);
    url.searchParams.set("per_page", "1");
    url.searchParams.set("orientation", "landscape");
    url.searchParams.set("content_filter", "high");

    const response = await fetchWithTimeout(
      url.toString(),
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
          "Accept-Version": "v1",
          "User-Agent": USER_AGENT,
        },
      },
      PAGE_TIMEOUT_MS,
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const result = data?.results?.[0];

    return result?.urls?.regular || result?.urls?.full || null;
  } catch (error) {
    console.warn(
      `[image-search] No se pudo buscar en Unsplash: ${error.message}`,
    );

    return null;
  }
}

function generatePollinationsImage(prompt) {
  const safePrompt = sanitizeTitle(prompt) || "indie music";
  const query = `${safePrompt} indie music editorial cover aesthetic`;
  const seed = Math.floor(Math.random() * 1_000_000);

  return `https://image.pollinations.ai/prompt/${encodeURIComponent(
    query,
  )}?width=1200&height=800&nologo=true&seed=${seed}`;
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

async function createExternalMedia(imageUrl, title) {
  try {
    return await prisma.media.create({
      data: {
        type: "IMAGE",
        filename: `external-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
        originalName: `${title.slice(0, 60)}.jpg`,
        mimeType: "image/jpeg",
        size: 0,
        url: imageUrl,
      },
    });
  } catch (error) {
    console.error(
      `[image-search] No se pudo crear el registro de respaldo: ${error.message}`,
    );

    return null;
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

  if (!safeTitle && !url) {
    return null;
  }

  let metadata = null;

  if (url) {
    try {
      metadata = await extractPageMetadata(url);
    } catch (error) {
      console.warn(
        `[image-search] Falló la extracción de la imagen original: ${error.message}`,
      );
    }
  }

  const suggestedTitle = buildSuggestedTitle(metadata);
  const contextQuery = buildContextQuery(metadata);
  // Si la publicación trae texto, lo usamos para buscar/generar la imagen.
  // El título manual queda como último recurso.
  const searchQuery = contextQuery || safeTitle;
  const pollinationsUrl = generatePollinationsImage(searchQuery);
  const fallbackTitle = suggestedTitle || safeTitle || "indie music";

  if (metadata?.imageUrl) {
    const result = await tryPersistCandidate(
      {
        url: metadata.imageUrl,
        source: isInstagramUrl(url) ? "instagram" : "og",
      },
      fallbackTitle,
    );

    if (result) {
      return { ...result, suggestedTitle };
    }
  }

  if (searchQuery) {
    const unsplashUrl = await searchUnsplash(searchQuery);

    if (unsplashUrl) {
      const result = await tryPersistCandidate(
        { url: unsplashUrl, source: "unsplash" },
        fallbackTitle,
      );

      if (result) {
        return { ...result, suggestedTitle };
      }
    }
  }

  const generated = await tryPersistCandidate(
    { url: pollinationsUrl, source: "pollinations" },
    fallbackTitle,
  );

  if (generated) {
    return { ...generated, suggestedTitle };
  }

  // Último recurso: devolvemos una imagen generada y un registro válido
  // para que el endpoint nunca responda con un 500 ni con mediaId nulo.
  const fallbackMedia = await createExternalMedia(
    pollinationsUrl,
    fallbackTitle,
  );

  return {
    url: fallbackMedia?.url || pollinationsUrl,
    mediaId: fallbackMedia?.id || null,
    source: "pollinations",
    suggestedTitle,
    fallback: true,
  };
}
