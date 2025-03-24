import express from 'express';
import bookmarkGroupsController from '../../controllers/bookmarkGroupsController.js';
import authMiddleware from '../../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, bookmarkGroupsController.getBookmarkGroups);
router.get(
  '/:id/articles',
  authMiddleware,
  bookmarkGroupsController.getBookmarkGroupWithArticles
);
router.post('/', authMiddleware, bookmarkGroupsController.createBookmarkGroup);
router.patch(
  '/:id',
  authMiddleware,
  bookmarkGroupsController.updateBookmarkGroup
);
router.delete(
  '/:id',
  authMiddleware,
  bookmarkGroupsController.deleteBookmarkGroup
);
router.post(
  '/:groupId/bookmarks/:bookmarkId',
  authMiddleware,
  bookmarkGroupsController.addBookmarkToGroup
);

router.delete(
  '/:groupId/bookmarks/:bookmarkId',
  authMiddleware,
  bookmarkGroupsController.removeBookmarkFromGroup
);

export default router;
