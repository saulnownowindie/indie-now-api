import { Router } from "express";

import {
  getNews,
  getNewsBySlugController,
  postNews,
  putNews,
  removeNews,
  postInstagramCover,
} from "./controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/", getNews);
router.post(
  "/instagram-cover",
  authenticate,
  postInstagramCover,
);
router.get("/:slug", getNewsBySlugController);

router.post("/", authenticate, postNews);
router.put("/:id", authenticate, putNews);
router.delete("/:id", authenticate, removeNews);

export default router;
