import { Router } from "express";

import {
  getFeaturedReelsController,
  getPublicReelsController,
  getReelBySlugController,
  getReels,
  postReel,
  postReelCoverFromUrl,
  postReelRequestPreview,
  putReel,
  removeReel,
} from "./controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/", getReels);
router.get("/public", getPublicReelsController);
router.get("/featured", getFeaturedReelsController);
router.post("/cover-from-url", authenticate, postReelCoverFromUrl);
router.post(
  "/:id/request-preview",
  authenticate,
  postReelRequestPreview,
);
router.get("/:slug", getReelBySlugController);
router.post("/", authenticate, postReel);
router.put("/:id", authenticate, putReel);
router.delete("/:id", authenticate, removeReel);

export default router;
