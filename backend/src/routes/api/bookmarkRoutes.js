import express from 'express';
import bookmarkController from '../../controllers/bookmarksController.js';
import authMiddleware from '../../middleware/authMiddleware.js';
import { validateNumericParam } from '../../middleware/validateParam.js';

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
