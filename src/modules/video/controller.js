import {
  createVideo,
  deleteVideo,
  getAllVideos,
  getVideoBySlug,
  updateVideo,
} from "./service.js";
import {
  createVideoSchema,
  updateVideoSchema,
  videoIdParamsSchema,
} from "./validation.js";

export const getVideos = async (req, res, next) => {
  try {
    const videos = await getAllVideos();

    res.json(videos);
  } catch (error) {
    next(error);
  }
};

export const getVideoBySlugController = async (req, res, next) => {
  try {
    const video = await getVideoBySlug(req.params.slug);

    if (!video) {
      return res.status(404).json({
        message: "Video no encontrado",
      });
    }

    res.json(video);
  } catch (error) {
    next(error);
  }
};

export const postVideo = async (req, res, next) => {
  try {
    const data = createVideoSchema.parse(req.body);
    const video = await createVideo(data, req.user.id);

    res.status(201).json(video);
  } catch (error) {
    next(error);
  }
};

export const putVideo = async (req, res, next) => {
  try {
    const { id } = videoIdParamsSchema.parse(req.params);
    const data = updateVideoSchema.parse(req.body);
    const video = await updateVideo(id, data);

    res.json(video);
  } catch (error) {
    next(error);
  }
};

export const removeVideo = async (req, res, next) => {
  try {
    const { id } = videoIdParamsSchema.parse(req.params);

    await deleteVideo(id);

    res.json({
      message: "Video eliminado correctamente",
    });
  } catch (error) {
    next(error);
  }
};
