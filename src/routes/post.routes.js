import { Router } from "express";

import {
  getPosts,
  getPost,
  postPost,
  putPost,
  removePost,
} from "../controllers/post.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", getPosts);
router.get("/:slug", getPost);
router.post("/", authenticate, postPost);
router.put("/:id", authenticate, putPost);
router.delete("/:id", authenticate, removePost);

export default router;