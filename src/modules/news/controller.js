import {
  createNews,
  deleteNews,
  getAllNews,
  getNewsBySlug,
  updateNews,
} from "./service.js";
import {
  createNewsSchema,
  newsIdParamsSchema,
  updateNewsSchema,
} from "./validation.js";

export const getNews = async (req, res, next) => {
  try {
    const news = await getAllNews();

    res.json(news);
  } catch (error) {
    next(error);
  }
};

export const getNewsBySlugController = async (req, res, next) => {
  try {
    const news = await getNewsBySlug(req.params.slug);

    if (!news) {
      return res.status(404).json({
        message: "Noticia no encontrada",
      });
    }

    res.json(news);
  } catch (error) {
    next(error);
  }
};

export const postNews = async (req, res, next) => {
  try {
    const data = createNewsSchema.parse(req.body);
    const news = await createNews(data, req.user.id);

    res.status(201).json(news);
  } catch (error) {
    next(error);
  }
};

export const putNews = async (req, res, next) => {
  try {
    const { id } = newsIdParamsSchema.parse(req.params);
    const data = updateNewsSchema.parse(req.body);
    const news = await updateNews(id, data);

    res.json(news);
  } catch (error) {
    next(error);
  }
};

export const removeNews = async (req, res, next) => {
  try {
    const { id } = newsIdParamsSchema.parse(req.params);

    await deleteNews(id);

    res.json({
      message: "Noticia eliminada correctamente",
    });
  } catch (error) {
    next(error);
  }
};
