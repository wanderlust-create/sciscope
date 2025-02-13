import express from "express";
import newsRoutes from "./api/newsRoutes.js";

const router = express.Router();

router.use("/news", newsRoutes);

export default router;
