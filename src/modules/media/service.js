import prisma from "../../config/prisma.js";

export const createImageMedia = async (file) => {
  return prisma.media.create({
    data: {
      type: "IMAGE",
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: `/uploads/images/${file.filename}`,
    },
  });
};
