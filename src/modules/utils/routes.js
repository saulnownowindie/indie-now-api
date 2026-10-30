import { Router } from "express";

import { postExtractCover } from "./controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

router.post("/extract-cover", authenticate, postExtractCover);

export default router;
