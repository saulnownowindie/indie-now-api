import { Router } from "express";

import { getConfig, putConfig } from "./controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/", getConfig);
router.put("/", authenticate, putConfig);

export default router;
