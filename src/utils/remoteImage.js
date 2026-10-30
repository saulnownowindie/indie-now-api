import prisma from "../config/prisma.js";
import { uploadBuffer } from "./cloudinaryUpload.js";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

const USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/131 Safari/537.36";

function httpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;

  return error;
}

export async function createMediaFromRemoteImage(
  imageUrl,
  { folder = "covers", prefix = "cover" } = {},
) {
  const response = await fetch(imageUrl, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "image/*",
    },
    redirect: "follow",
  });

  if (!response.ok) {
    throw httpError(
      `No se pudo descargar la imagen. HTTP ${response.status}.`,
      502,
    );
  }

  const contentType =
    response.headers.get("content-type") || "image/jpeg";

  if (!contentType.startsWith("image/")) {
    throw httpError(
      "La URL obtenida no corresponde a una imagen.",
      502,
    );
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  if (!buffer.length) {
    throw httpError("La imagen obtenida está vacía.", 502);
  }

  if (buffer.length > MAX_IMAGE_BYTES) {
    throw httpError("La imagen supera los 4MB.", 413);
  }

  const publicId = `${prefix}-${Date.now()}-${Math.round(
    Math.random() * 1e9,
  )}`;

  const uploaded = await uploadBuffer(buffer, {
    folder,
    public_id: publicId,
  });

  return prisma.media.create({
    data: {
      type: "IMAGE",
      filename: uploaded.public_id,
      originalName: `${publicId}.${uploaded.format}`,
      mimeType: contentType,
      size: buffer.length,
      url: uploaded.secure_url,
    },
  });
}
