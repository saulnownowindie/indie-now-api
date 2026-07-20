import { Router } from "express";

import {
  getPosts,
  getPost,
  postPost,
} from "../controllers/post.controller.js";

import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", getPosts);
router.get("/:slug", getPost);
router.post("/", authenticate, postPost);

export default router;