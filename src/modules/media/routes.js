import { Router } from "express";

import upload from "../../middlewares/upload.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import {
  getMedia,
  getMediaByIdController,
  putMedia,
  removeMedia,
  uploadMedia,
} from "./controller.js";

const router = Router();

router.get("/", getMedia);
router.get("/:id", getMediaByIdController);
router.post("/", authenticate, upload.single("file"), uploadMedia);
router.put("/:id", authenticate, putMedia);
router.delete("/:id", authenticate, removeMedia);

export default router;
