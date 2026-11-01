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

const INSTAGRAM_HOSTS = new Set(["instagram.com", "www.instagram.com"]);

const OG_IMAGE_SELECTORS = [
  'meta[property="og:image"]',
  'meta[property="og:image:secure_url"]',
  'meta[name="twitter:image"]',
  'meta[property="twitter:image"]',
];

function sanitizeTitle(title) {
  return String(title ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_TITLE_LENGTH);
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

async function extractOgImage(pageUrl) {
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
    const content = OG_IMAGE_SELECTORS.map((selector) =>
      root.querySelector(selector)?.getAttribute("content"),
    ).find(Boolean);

    if (!content) {
      return null;
    }

    const imageUrl = new URL(
      content.replace(/&amp;/g, "&").trim(),
      pageUrl,
    ).toString();

    // Instagram suele devolver su logo estático cuando bloquea el scraping.
    if (imageUrl.includes("instagram.com/static")) {
      return null;
    }

    return isAllowedRemoteUrl(imageUrl) ? imageUrl : null;
  } catch (error) {
    console.warn(
      `[image-search] No se pudo extraer la imagen de ${pageUrl}: ${error.message}`,
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
  const query = `${prompt} indie music editorial cover aesthetic`;
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

export async function findBestImage(title, url) {
  const safeTitle = sanitizeTitle(title);

  if (!safeTitle) {
    return null;
  }

  const pollinationsUrl = generatePollinationsImage(safeTitle);
  const candidates = [];

  if (url) {
    try {
      const ogImage = await extractOgImage(url);

      if (ogImage) {
        candidates.push({
          url: ogImage,
          source: isInstagramUrl(url) ? "instagram" : "og",
        });
      }
    } catch (error) {
      console.warn(
        `[image-search] Falló la extracción de la imagen original: ${error.message}`,
      );
    }
  }

  try {
    const unsplashUrl = await searchUnsplash(safeTitle);

    if (unsplashUrl) {
      candidates.push({ url: unsplashUrl, source: "unsplash" });
    }
  } catch (error) {
    console.warn(
      `[image-search] Falló la búsqueda en Unsplash: ${error.message}`,
    );
  }

  candidates.push({ url: pollinationsUrl, source: "pollinations" });

  const seen = new Set();

  for (const candidate of candidates) {
    if (!candidate.url || seen.has(candidate.url)) {
      continue;
    }

    seen.add(candidate.url);

    try {
      const media = await persistImage(
        candidate.url,
        safeTitle,
        candidate.source,
      );

      return {
        url: media.url,
        mediaId: media.id,
        source: candidate.source,
      };
    } catch (error) {
      console.warn(
        `[image-search] No se pudo guardar la imagen de ${candidate.source}: ${error.message}`,
      );
    }
  }

  // Último recurso: devolvemos una imagen generada y un registro válido
  // para que el endpoint nunca responda con un 500 ni con mediaId nulo.
  const fallbackMedia = await createExternalMedia(pollinationsUrl, safeTitle);

  return {
    url: fallbackMedia?.url || pollinationsUrl,
    mediaId: fallbackMedia?.id || null,
    source: "pollinations",
    fallback: true,
  };
}
