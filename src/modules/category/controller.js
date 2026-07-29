import {
  createCategory,
  deleteCategory,
  getAllCategories,
  getCategoryBySlug,
  updateCategory,
} from "./service.js";
import { categoryIdParamsSchema, categorySchema } from "./validation.js";

export const getCategories = async (req, res, next) => {
  try {
    const categories = await getAllCategories();

    res.json(categories);
  } catch (error) {
    next(error);
  }
};

export const getCategory = async (req, res, next) => {
  try {
    const category = await getCategoryBySlug(req.params.slug);

    if (!category) {
      return res.status(404).json({
        message: "Categoría no encontrada",
      });
    }

    res.json(category);
  } catch (error) {
    next(error);
  }
};

export const postCategory = async (req, res, next) => {
  try {
    const data = categorySchema.parse(req.body);
    const category = await createCategory(data);

    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
};

export const putCategory = async (req, res, next) => {
  try {
    const { id } = categoryIdParamsSchema.parse(req.params);
    const data = categorySchema.parse(req.body);
    const category = await updateCategory(id, data);

    res.json(category);
  } catch (error) {
    next(error);
  }
};

export const removeCategory = async (req, res, next) => {
  try {
    const { id } = categoryIdParamsSchema.parse(req.params);

    await deleteCategory(id);

    res.json({
      message: "Categoría eliminada correctamente",
    });
  } catch (error) {
    next(error);
  }
};
