import {
  getAllCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../services/category.service.js";

import { categorySchema } from "../validators/category.validator.js";

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
    const { slug } = req.params;

    const category = await getCategoryBySlug(slug);

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
    const data = categorySchema.parse(req.body);

    const category = await updateCategory(req.params.id, data);

    res.json(category);
  } catch (error) {
    next(error);
  }
};

export const removeCategory = async (req, res, next) => {
  try {
    await deleteCategory(req.params.id);

    res.json({
      message: "Categoría eliminada correctamente",
    });
  } catch (error) {
    next(error);
  }
};