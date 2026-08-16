import supabase from "../../config/supabase.js";
import prisma from "../../config/prisma.js";

const BUCKET = "news-covers";

const isInstagramUrl = (value) => {
  try {
    const url = new URL(value);

    return (
      url.hostname === "instagram.com" ||
      url.hostname === "www.instagram.com"
    );
  } catch {
    return false;
  }
};

const extractOgImage = (html) => {
  const propertyFirst = html.match(
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i,
  );

  if (propertyFirst?.[1]) {
    return propertyFirst[1].replace(/&amp;/g, "&");
  }

  const contentFirst = html.match(
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["'][^>]*>/i,
  );

  if (contentFirst?.[1]) {
    return contentFirst[1].replace(/&amp;/g, "&");
  }

  return null;
};

const getExtensionFromType = (contentType) => {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  return "jpg";
};

export const createInstagramCover = async (instagramUrl) => {
  if (!isInstagramUrl(instagramUrl)) {
    throw new Error("La URL proporcionada no es de Instagram.");
  }

  const response = await fetch(instagramUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/131 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
    },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(
      `Instagram respondió con HTTP ${response.status}.`,
    );
  }

  const html = await response.text();
  const imageUrl = extractOgImage(html);

  if (!imageUrl) {
    throw new Error(
      "Instagram no permitió obtener automáticamente la imagen de portada.",
    );
  }

  const imageResponse = await fetch(imageUrl);

  if (!imageResponse.ok) {
    throw new Error(
      `No se pudo descargar la imagen de Instagram. HTTP ${imageResponse.status}.`,
    );
  }

  const contentType =
    imageResponse.headers.get("content-type") || "image/jpeg";

  if (!contentType.startsWith("image/")) {
    throw new Error(
      "La URL obtenida desde Instagram no corresponde a una imagen.",
    );
  }

  const buffer = Buffer.from(
    await imageResponse.arrayBuffer(),
  );

  if (!buffer.length) {
    throw new Error("La imagen obtenida está vacía.");
  }

  const extension = getExtensionFromType(contentType);

  const fileName = `instagram-${Date.now()}-${Math.round(
    Math.random() * 1e9,
  )}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, buffer, {
      contentType,
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(fileName);

  return prisma.media.create({
    data: {
      type: "IMAGE",
      filename: fileName,
      originalName: fileName,
      mimeType: contentType,
      size: buffer.length,
      url: publicUrlData.publicUrl,
    },
  });
};
