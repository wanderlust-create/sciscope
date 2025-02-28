import express from 'express';
import newsRoutes from './newsRoutes.js';
import authRoutes from './authRoutes.js';
import protectedRoutes from './protectedRoutes.js';
import searchArticles from './articles.search.js';

const router = express.Router();

router.use('/news', newsRoutes);
router.use('/auth', authRoutes);
router.use(protectedRoutes);
router.use('/search', searchArticles);

export default router;
