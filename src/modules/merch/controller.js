import {
  createMerch,
  deleteMerch,
  getAllMerch,
  getFeaturedMerch,
  getMerchBySlug,
  updateMerch,
} from "./service.js";
import {
  createMerchSchema,
  merchIdParamsSchema,
  updateMerchSchema,
} from "./validation.js";

export const getMerch = async (req, res, next) => {
  try {
    const merch = await getAllMerch();

    res.json(merch);
  } catch (error) {
    next(error);
  }
};

export const getFeaturedMerchController = async (req, res, next) => {
  try {
    const merch = await getFeaturedMerch();

    res.json(merch);
  } catch (error) {
    next(error);
  }
};

export const getMerchBySlugController = async (req, res, next) => {
  try {
    const merch = await getMerchBySlug(req.params.slug);

    if (!merch) {
      return res.status(404).json({
        message: "Producto de merch no encontrado",
      });
    }

    res.json(merch);
  } catch (error) {
    next(error);
  }
};

export const postMerch = async (req, res, next) => {
  try {
    const data = createMerchSchema.parse(req.body);
    const merch = await createMerch(data, req.user.id);

    res.status(201).json(merch);
  } catch (error) {
    next(error);
  }
};

export const putMerch = async (req, res, next) => {
  try {
    const { id } = merchIdParamsSchema.parse(req.params);
    const data = updateMerchSchema.parse(req.body);
    const merch = await updateMerch(id, data);

    res.json(merch);
  } catch (error) {
    next(error);
  }
};

export const removeMerch = async (req, res, next) => {
  try {
    const { id } = merchIdParamsSchema.parse(req.params);

    await deleteMerch(id);

    res.json({
      message: "Producto de merch eliminado correctamente",
    });
  } catch (error) {
    next(error);
  }
};
