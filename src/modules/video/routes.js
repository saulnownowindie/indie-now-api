import { Router } from "express";

import {
  getVideos,
  getVideoBySlugController,
  postVideo,
  putVideo,
  removeVideo,
} from "./controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/", getVideos);
router.get("/:slug", getVideoBySlugController);
router.post("/", authenticate, postVideo);
router.put("/:id", authenticate, putVideo);
router.delete("/:id", authenticate, removeVideo);

export default router;
