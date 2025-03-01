import express from 'express';
import articleRoutes from './articlesRoutes.js';
import authRoutes from './authRoutes.js';
import newsRoutes from './newsRoutes.js';
import protectedRoutes from './protectedRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use(protectedRoutes);
router.use('/news', newsRoutes);
router.use('/articles', articleRoutes);

export default router;
