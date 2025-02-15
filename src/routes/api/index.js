import express from "express";
import newsRoutes from "./newsRoutes.js";
import authRoutes from "./authRoutes.js";

const router = express.Router();

router.use("/news", newsRoutes);
router.use("/auth", authRoutes);

export default router;
