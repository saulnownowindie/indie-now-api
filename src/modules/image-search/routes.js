import { Router } from "express";
import { searchImage } from "./controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();
router.post("/", authenticate, searchImage);
export default router;
