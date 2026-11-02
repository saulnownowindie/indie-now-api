import { getSiteConfig, updateSiteConfig } from "./service.js";
import { updateSiteConfigSchema } from "./validation.js";

export const getConfig = async (req, res, next) => {
  try {
    const config = await getSiteConfig();
    res.json(config);
  } catch (error) {
    next(error);
  }
};

export const putConfig = async (req, res, next) => {
  try {
    const data = updateSiteConfigSchema.parse(req.body);
    const config = await updateSiteConfig(data);
    res.json(config);
  } catch (error) {
    next(error);
  }
};
