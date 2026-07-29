import {
  createLiveSession,
  deleteLiveSession,
  getAllLiveSessions,
  getFeaturedLiveSessions,
  getLiveSessionBySlug,
  updateLiveSession,
} from "./service.js";
import {
  createLiveSessionSchema,
  liveSessionIdParamsSchema,
  updateLiveSessionSchema,
} from "./validation.js";

export const getLiveSessions = async (req, res, next) => {
  try {
    const liveSessions = await getAllLiveSessions();

    res.json(liveSessions);
  } catch (error) {
    next(error);
  }
};

export const getFeaturedLiveSessionsController = async (req, res, next) => {
  try {
    const liveSessions = await getFeaturedLiveSessions();

    res.json(liveSessions);
  } catch (error) {
    next(error);
  }
};

export const getLiveSessionBySlugController = async (req, res, next) => {
  try {
    const liveSession = await getLiveSessionBySlug(req.params.slug);

    if (!liveSession) {
      return res.status(404).json({
        message: "Indie Now Session no encontrada",
      });
    }

    res.json(liveSession);
  } catch (error) {
    next(error);
  }
};

export const postLiveSession = async (req, res, next) => {
  try {
    const data = createLiveSessionSchema.parse(req.body);
    const liveSession = await createLiveSession(data, req.user.id);

    res.status(201).json(liveSession);
  } catch (error) {
    next(error);
  }
};

export const putLiveSession = async (req, res, next) => {
  try {
    const { id } = liveSessionIdParamsSchema.parse(req.params);
    const data = updateLiveSessionSchema.parse(req.body);
    const liveSession = await updateLiveSession(id, data);

    res.json(liveSession);
  } catch (error) {
    next(error);
  }
};

export const removeLiveSession = async (req, res, next) => {
  try {
    const { id } = liveSessionIdParamsSchema.parse(req.params);

    await deleteLiveSession(id);

    res.json({
      message: "Indie Now Session eliminada correctamente",
    });
  } catch (error) {
    next(error);
  }
};
