import { Router } from "express";

import {
  getCategories,
  getCategory,
  postCategory,
  putCategory,
  removeCategory,
} from "./controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/", getCategories);
router.get("/:slug", getCategory);
router.post("/", authenticate, postCategory);
router.put("/:id", authenticate, putCategory);
router.delete("/:id", authenticate, removeCategory);

export default router;
