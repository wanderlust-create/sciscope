import express from 'express';
import searchRoutes from './searchRoutes.js';
import authRoutes from './authRoutes.js';
import bookmarkRoutes from './bookmarkRoutes.js';
import newsRoutes from './newsRoutes.js';
import protectedRoutes from './protectedRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use(protectedRoutes);
router.use('/news', newsRoutes);
router.use('/search', searchRoutes);
router.use('/bookmarks', bookmarkRoutes);

export default router;
