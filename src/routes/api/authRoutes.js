import express from 'express';
import AuthController from '../../controllers/authController.js';
import authMiddleware from '../../middleware/authMiddleware.js';

const router = express.Router();

router.post('/signup', AuthController.signup);
router.post('/login', AuthController.login);
router.post('/oauth', AuthController.oauthLogin);
router.post('/logout', authMiddleware, AuthController.logout);

export default router;
