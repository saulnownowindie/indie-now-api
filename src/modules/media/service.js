import prisma from "../../config/prisma.js";
import { deleteAsset, uploadBuffer } from "../../utils/cloudinaryUpload.js";

const DEFAULT_FOLDER = "news-covers";

export const getAllMedia = async () => {
  return prisma.media.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getMediaById = async (id) => {
  return prisma.media.findUnique({
    where: { id },
  });
};

export const createImageMedia = async (file, folder = DEFAULT_FOLDER) => {
  if (!Buffer.isBuffer(file?.buffer) || file.buffer.length === 0) {
    const error = new Error("El archivo no contiene datos válidos.");
    error.statusCode = 400;
    throw error;
  }

  const publicId = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

  let uploaded;

  try {
    uploaded = await uploadBuffer(file.buffer, {
      folder,
      public_id: publicId,
    });
  } catch (cause) {
    // Cloudinary es un servicio externo: 502 identifica el fallo upstream
    // sin confundirlo con un error interno de la API.
    const error = new Error(
      "No se pudo subir la imagen a Cloudinary. Revisa las credenciales del servicio.",
    );
    error.statusCode = 502;
    error.cause = cause;
    throw error;
  }

  return prisma.media.create({
    data: {
      type: "IMAGE",
      filename: uploaded.public_id,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: uploaded.secure_url,
    },
  });
};

export const updateMedia = async (id, data) => {
  return prisma.media.update({
    where: { id },
    data,
  });
};

export const deleteMedia = async (id) => {
  const media = await prisma.media.delete({
    where: { id },
  });

  if (media.type === "IMAGE") {
    await deleteAsset(media.filename);
  }

  return media;
};