import { Router } from "express";

import {
  getFeaturedPlaylistsController,
  getPlaylistBySlugController,
  getPlaylists,
  postPlaylist,
  putPlaylist,
  removePlaylist,
  syncPlaylistController,
} from "./controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/", getPlaylists);
router.get("/featured", getFeaturedPlaylistsController);
router.get("/:slug", getPlaylistBySlugController);
router.post("/", authenticate, postPlaylist);
router.put("/:id", authenticate, putPlaylist);
router.post("/:id/sync", authenticate, syncPlaylistController);
router.delete("/:id", authenticate, removePlaylist);

export default router;
