import { Router } from "express";
import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
import postRoutes from "./postRoutes.js";
import { issueCsrfToken } from "../middleware/csrf.js";

const router = Router();

router.get("/health", (req, res) => {
  res.json({ success: true, status: "ok" });
});

router.get("/csrf-token", issueCsrfToken);

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/posts", postRoutes);

export default router;
