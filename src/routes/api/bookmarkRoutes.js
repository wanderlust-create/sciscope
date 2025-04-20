import express from 'express';
import bookmarkController from '../../controllers/bookmarksController.js';
import { authMiddleware, validateNumericParam } from '../../middleware';

const router = express.Router();

router.get('/', authMiddleware, bookmarkController.getBookmarks);
router.post('/', authMiddleware, bookmarkController.createBookmark);
router.delete(
  '/:id',
  authMiddleware,
  validateNumericParam('id'),
  bookmarkController.deleteBookmark
);

export default router;
