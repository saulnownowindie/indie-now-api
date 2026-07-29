import { Router } from "express";

import {
  getFeaturedLiveSessionsController,
  getLiveSessions,
  getLiveSessionBySlugController,
  postLiveSession,
  putLiveSession,
  removeLiveSession,
} from "./controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/", getLiveSessions);
router.get("/featured", getFeaturedLiveSessionsController);
router.get("/:slug", getLiveSessionBySlugController);
router.post("/", authenticate, postLiveSession);
router.put("/:id", authenticate, putLiveSession);
router.delete("/:id", authenticate, removeLiveSession);

export default router;
