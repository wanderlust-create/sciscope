import express from "express";

const router = express.Router();

// Placeholder response 
router.get("/", (req, res) => {
  res.json({ message: "Science news API is working!" });
});

export default router;
