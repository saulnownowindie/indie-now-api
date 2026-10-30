import { Router } from "express";

import { authenticateWorker } from "../../middlewares/workerAuth.middleware.js";
import {
  getPendingPreviews,
  patchReelPreview,
} from "./controller.js";

const router = Router();

router.get("/pending-previews", authenticateWorker, getPendingPreviews);
router.patch(
  "/reels/:id/preview",
  authenticateWorker,
  patchReelPreview,
);

export default router;
