import logger from '../loaders/logger.js';
import bookmarkService from '../services/bookmarkService.js';

/**
 * Fetches paginated bookmarks for the authenticated user.
 * @param {Object} req - Express request object with pagination query.
 * @param {Object} res - Express response object.
 */
export async function getBookmarks(req, res) {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const paginatedBookmarks = await bookmarkService.getBookmarks(
      userId,
      Number(page),
      Number(limit)
    );

    res.status(200).json(paginatedBookmarks);
  } catch (error) {
    logger.error(`❌ Error fetching bookmarks: ${error.message}`, {
      stack: error.stack,
    });

    res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * Creates a new bookmark for the logged-in user.
 * @param {Object} req - Express request object with article ID.
 * @param {Object} res - Express response object.
 */
export async function createBookmark(req, res) {
  try {
    const userId = req.user.id;
    const { article_id } = req.body;

    if (!article_id) {
      return res.status(400).json({ error: 'Article ID is required' });
    }

    const bookmark = await bookmarkService.createBookmark(userId, article_id);

    res.status(201).json(bookmark);
  } catch (error) {
    logger.error(`Error creating bookmark: ${error.message}`, {
      stack: error.stack,
    });

    if (error.message === 'Article already bookmarked') {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * Deletes a bookmark by ID for the logged-in user.
 * @param {Object} req - Express request object with search query.
 * @param {Object} res - Express response object.
 */
export async function deleteBookmark(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Bookmark ID is required' });
    }

    // 🔍 Optional: verify that the bookmark exists before deletion
    const bookmark = await bookmarkService.getBookmarkByIdAndUser(id, userId);

    if (!bookmark || bookmark.userId !== userId) {
      return res
        .status(404)
        .json({ error: 'Bookmark not found or unauthorized' });
    }

    // ✅ Proceed with deletion
    await bookmarkService.deleteBookmark(id, userId);
    return res.status(204).send();
  } catch (error) {
    logger.error(`❌ Error deleting bookmark: ${error.message}`, {
      stack: error.stack,
    });
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

export default { getBookmarks, createBookmark, deleteBookmark };
