import { findBestImage } from "./service.js";

export const searchImage = async (req, res, next) => {
  try {
    const { title, url } = req.body;
    if (!title && !url) return res.status(400).json({ message: "Se requiere título o URL" });

    const result = await findBestImage(title, url);
    if (!result) return res.status(404).json({ message: "No se encontró imagen" });

    res.json(result);
  } catch (error) {
    next(error);
  }
};
