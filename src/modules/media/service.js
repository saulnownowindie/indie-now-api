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
  const publicId = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

  const uploaded = await uploadBuffer(file.buffer, {
    folder,
    public_id: publicId,
  });

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