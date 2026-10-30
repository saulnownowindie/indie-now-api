import {
  createReel,
  deleteReel,
  getAllReels,
  getFeaturedReels,
  getPublicReels,
  getReelBySlug,
  requestReelPreview,
  updateReel,
} from "./service.js";
import {
  coverFromUrlSchema,
  createReelSchema,
  reelIdParamsSchema,
  requestPreviewSchema,
  updateReelSchema,
} from "./validation.js";
import { getCoverFromSocialUrl } from "./cover.js";
import { parseHomeSection } from "../../utils/homeSections.js";

export const getReels = async (req, res, next) => {
  try {
    const reels = await getAllReels();

    res.json(reels);
  } catch (error) {
    next(error);
  }
};

export const getPublicReelsController = async (req, res, next) => {
  try {
    const section = parseHomeSection(req.query.section);

    if (req.query.section && !section) {
      return res.status(400).json({
        message: "La sección indicada no es válida.",
      });
    }

    const reels = await getPublicReels(section);

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

export const postReelCoverFromUrl = async (req, res, next) => {
  try {
    const { url } = coverFromUrlSchema.parse(req.body);
    const result = await getCoverFromSocialUrl(url);

    if (result.manual) {
      return res.json({
        manual: true,
        message:
          "Instagram ya no expone miniaturas. Subí la portada manualmente.",
      });
    }

    res.status(201).json({
      manual: false,
      message: "Portada obtenida correctamente.",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const postReelRequestPreview = async (req, res, next) => {
  try {
    const { id } = reelIdParamsSchema.parse(req.params);
    const data = requestPreviewSchema.parse(req.body);
    const reel = await requestReelPreview(id, data);

    res.json(reel);
  } catch (error) {
    next(error);
  }
};
