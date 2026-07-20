import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import postRoutes from "./routes/post.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Indie Now API funcionando 🚀",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);

export default app;