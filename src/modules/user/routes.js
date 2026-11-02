import { Router } from "express";

import { getUsers, postUser, removeUser } from "./controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/", authenticate, getUsers);
router.post("/", authenticate, postUser);
router.delete("/:id", authenticate, removeUser);

export default router;
