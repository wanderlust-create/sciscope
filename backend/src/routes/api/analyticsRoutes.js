import express from 'express';
import analyticsController from '../../controllers/analyticsController.js';

const router = express.Router();

router.get(
  '/most-bookmarked-articles',
  analyticsController.mostBookmarkedArticles
);
router.get('/top-bookmarking-users', analyticsController.topBookmarkingUsers);

export default router;
