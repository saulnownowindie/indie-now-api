import prisma from "../config/prisma.js";
export const uploadMedia = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      message: "No se recibió ningún archivo.",
    });
  }

  const folder = req.file.mimetype.startsWith("image/") ? "images" : "videos";
  const media = await prisma.media.create({
    data: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      url: `/uploads/${folder}/${req.file.filename}`,
    },
  });
  res.status(201).json({
    message: "Archivo subido correctamente.",
    media,
  });
};
