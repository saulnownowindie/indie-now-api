import prisma from "../../config/prisma.js";
import { uploadBuffer } from "../../utils/cloudinaryUpload.js";

const FOLDER = "news-covers";

export const createImageMedia = async (file) => {
  const publicId = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

  const uploaded = await uploadBuffer(file.buffer, {
    folder: FOLDER,
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
