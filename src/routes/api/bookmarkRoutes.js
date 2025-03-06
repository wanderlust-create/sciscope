import express from 'express';
import bookmarkController from '../../controllers/bookmarksController.js';
import authMiddleware from '../../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, bookmarkController.getBookmarks);
router.post('/', authMiddleware, bookmarkController.createBookmark);
router.delete('/:id', authMiddleware, bookmarkController.deleteBookmark);

export default router;
