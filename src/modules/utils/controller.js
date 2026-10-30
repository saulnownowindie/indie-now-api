import { extractCover } from "./service.js";

export const postExtractCover = async (req, res, next) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== "string") {
      return res.status(400).json({
        message: "La URL del video es obligatoria.",
      });
    }

    const result = await extractCover(url.trim());

    res.status(201).json({
      message: "Portada extraída correctamente.",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};
