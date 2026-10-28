import {
  createImageMedia,
  deleteMedia,
  getAllMedia,
  getMediaById,
  updateMedia,
} from "./service.js";
import {
  mediaFileSchema,
  mediaIdParamsSchema,
  updateMediaSchema,
} from "./validation.js";

export const getMedia = async (req, res, next) => {
  try {
    const media = await getAllMedia();

    res.json(media);
  } catch (error) {
    next(error);
  }
};

export const getMediaByIdController = async (req, res, next) => {
  try {
    const { id } = mediaIdParamsSchema.parse(req.params);
    const media = await getMediaById(id);

    if (!media) {
      return res.status(404).json({
        message: "Archivo no encontrado",
      });
    }

    res.json(media);
  } catch (error) {
    next(error);
  }
};

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

export const putMedia = async (req, res, next) => {
  try {
    const { id } = mediaIdParamsSchema.parse(req.params);
    const data = updateMediaSchema.parse(req.body);
    const media = await updateMedia(id, data);

    res.json(media);
  } catch (error) {
    next(error);
  }
};

export const removeMedia = async (req, res, next) => {
  try {
    const { id } = mediaIdParamsSchema.parse(req.params);

    await deleteMedia(id);

    res.json({
      message: "Archivo eliminado correctamente",
    });
  } catch (error) {
    next(error);
  }
};
