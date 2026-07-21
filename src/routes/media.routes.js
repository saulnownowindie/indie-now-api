import { Router } from "express";
import upload from "../middlewares/upload.middleware.js";
import { uploadMedia } from "../controllers/media.controller.js";

const router = Router();

router.post("/", upload.single("file"), uploadMedia);

export default router;