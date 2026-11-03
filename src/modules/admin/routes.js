import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware.js";
import { getNewsAdmin } from "../news/controller.js";
import { getReelsAdmin } from "../reel/controller.js";
import { getVideosAdmin } from "../video/controller.js";
import { getLiveSessionsAdmin } from "../liveSession/controller.js";
import { getMerchAdmin } from "../merch/controller.js";
import { getPlaylistsAdmin } from "../playlist/controller.js";

const router = Router();

// Lectura completa del CMS: incluye borradores y datos internos.
router.use(authenticate);

router.get("/news", getNewsAdmin);
router.get("/reels", getReelsAdmin);
router.get("/videos", getVideosAdmin);
router.get("/live-sessions", getLiveSessionsAdmin);
router.get("/merch", getMerchAdmin);
router.get("/playlists", getPlaylistsAdmin);

export default router;
