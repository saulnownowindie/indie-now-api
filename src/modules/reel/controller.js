import {
  createReel,
  deleteReel,
  getAllReels,
  getFeaturedReels,
  getReelBySlug,
  updateReel,
} from "./service.js";
import {
  createReelSchema,
  reelIdParamsSchema,
  updateReelSchema,
} from "./validation.js";

export const getReels = async (req, res, next) => {
  try {
    const reels = await getAllReels();

    res.json(reels);
  } catch (error) {
    next(error);
  }
};

export const getFeaturedReelsController = async (req, res, next) => {
  try {
    const reels = await getFeaturedReels();

    res.json(reels);
  } catch (error) {
    next(error);
  }
};

export const getReelBySlugController = async (req, res, next) => {
  try {
    const reel = await getReelBySlug(req.params.slug);

    if (!reel) {
      return res.status(404).json({
        message: "Reel no encontrado",
      });
    }

    res.json(reel);
  } catch (error) {
    next(error);
  }
};

export const postReel = async (req, res, next) => {
  try {
    const data = createReelSchema.parse(req.body);
    const reel = await createReel(data, req.user.id);

    res.status(201).json(reel);
  } catch (error) {
    next(error);
  }
};

export const putReel = async (req, res, next) => {
  try {
    const { id } = reelIdParamsSchema.parse(req.params);
    const data = updateReelSchema.parse(req.body);
    const reel = await updateReel(id, data);

    res.json(reel);
  } catch (error) {
    next(error);
  }
};

export const removeReel = async (req, res, next) => {
  try {
    const { id } = reelIdParamsSchema.parse(req.params);

    await deleteReel(id);

    res.json({
      message: "Reel eliminado correctamente",
    });
  } catch (error) {
    next(error);
  }
};
