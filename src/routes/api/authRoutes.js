import express from "express";
import AuthController from "../../controllers/authController.js";

const router = express.Router();

router.post("/signup", AuthController.signup);
router.post("/login", AuthController.login);
router.post("/oauth", AuthController.oauthLogin);

export default router;
