import { createImageMedia } from "./service.js";
import { mediaFileSchema } from "./validation.js";

export const uploadMedia = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No se recibió ningún archivo.",
      });
    }

    const file = mediaFileSchema.parse(req.file);
    const media = await createImageMedia(file);

    res.status(201).json({
      message: "Archivo subido correctamente.",
      media,
    });
  } catch (error) {
    next(error);
  }
};
