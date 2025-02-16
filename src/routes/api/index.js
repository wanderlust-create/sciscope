import express from 'express';
import newsRoutes from './newsRoutes.js';
import authRoutes from './authRoutes.js';
import protectedRoutes from './protectedRoutes.js';

const router = express.Router();

router.use('/news', newsRoutes);
router.use('/auth', authRoutes);
router.use(protectedRoutes);

export default router;
