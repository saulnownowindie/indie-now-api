import { Router } from "express";

import {
  getFeaturedMerchController,
  getMerch,
  getMerchBySlugController,
  postMerch,
  putMerch,
  removeMerch,
} from "./controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/", getMerch);
router.get("/featured", getFeaturedMerchController);
router.get("/:slug", getMerchBySlugController);
router.post("/", authenticate, postMerch);
router.put("/:id", authenticate, putMerch);
router.delete("/:id", authenticate, removeMerch);

export default router;
