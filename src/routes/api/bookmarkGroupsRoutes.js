import express from 'express';
import bookmarkGroupsController from '../../controllers/bookmarkGroupsController.js';
import authMiddleware from '../../middleware/authMiddleware.js';
import { validateNumericParam } from '../../middleware/validateParam.js';

const router = express.Router();

router.get('/', authMiddleware, bookmarkGroupsController.getBookmarkGroups);
router.get(
  '/:id/articles',
  authMiddleware,
  validateNumericParam('id'),
  bookmarkGroupsController.getBookmarkGroupWithArticles
);
router.post('/', authMiddleware, bookmarkGroupsController.createBookmarkGroup);
router.patch(
  '/:id',
  authMiddleware,
  validateNumericParam('id'),
  bookmarkGroupsController.updateBookmarkGroup
);
router.delete(
  '/:id',
  authMiddleware,
  validateNumericParam('id'),
  bookmarkGroupsController.deleteBookmarkGroup
);
router.post(
  '/:groupId/bookmarks/:bookmarkId',
  authMiddleware,
  validateNumericParam('groupId'),
  validateNumericParam('bookmarkId'),
  bookmarkGroupsController.addBookmarkToGroup
);

router.delete(
  '/:groupId/bookmarks/:bookmarkId',
  authMiddleware,
  validateNumericParam('groupId'),
  validateNumericParam('bookmarkId'),
  bookmarkGroupsController.removeBookmarkFromGroup
);

export default router;
