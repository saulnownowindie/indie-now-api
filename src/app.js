
import express from "express";
import cors from "cors";

import authRoutes from "./modules/auth/routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import categoryRoutes from "./modules/category/routes.js";
import mediaRoutes from "./modules/media/routes.js";
import liveSessionRoutes from "./modules/liveSession/routes.js";
import merchRoutes from "./modules/merch/routes.js";
import newsRoutes from "./modules/news/routes.js";
import playlistRoutes from "./modules/playlist/routes.js";
import reelRoutes from "./modules/reel/routes.js";
import videoRoutes from "./modules/video/routes.js";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Indie Now API funcionando 🚀",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Indie Now API",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/live-sessions", liveSessionRoutes);
app.use("/api/merch", merchRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/playlists", playlistRoutes);
app.use("/api/reels", reelRoutes);
app.use("/api/videos", videoRoutes);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

app.use(errorHandler);

export default app;
