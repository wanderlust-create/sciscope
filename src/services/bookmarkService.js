import logger from '../loaders/logger.js';
import Article from '../models/Article.js';
import Bookmark from '../models/Bookmark.js';

/**
 * Retrieves all bookmarks for a specific user.
 * @param {number} userId - The user's ID.
 * @returns {Promise<Array>} - List of bookmarked articles.
 */
export async function getBookmarks(userId) {
  try {
    return await Bookmark.query()
      .where({ user_id: userId })
      .withGraphFetched('article') // Fetch related article details
      .orderBy('bookmarked_at', 'desc');
  } catch (error) {
    logger.error(`❌ Error fetching bookmarks: ${error.message}`);
    throw new Error('Failed to retrieve bookmarks.');
  }
}

/**
 * Creates a new bookmark for a user.
 * @param {number} userId - ID of the user.
 * @param {number} articleId - ID of the article.
 * @returns {Promise<Object>} - The created bookmark.
 */
export async function createBookmark(userId, articleId) {
  try {
    // Ensure the article exists before bookmarking
    const articleExists = await Article.query().findById(articleId);
    if (!articleExists) {
      throw new Error('Article not found.');
    }

    // Insert the bookmark (if it doesn't already exist)
    const bookmark = await Bookmark.query()
      .insert({ user_id: userId, article_id: articleId })
      .returning('*');

    return bookmark;
  } catch (error) {
    logger.error('Error creating bookmark: ${error.message}');
    throw new Error(error.message);
  }
}

/**
 * Deletes a bookmark for a user.
 * @param {number} id - Bookmark ID.
 * @param {number} userId - ID of the user.
 * @returns {Promise<boolean>} - `true` if deleted, `false` otherwise.
 */
export async function deleteBookmark(id, userId) {
  try {
    const deletedCount = await Bookmark.query()
      .where({ id, user_id: userId }) // ✅ Ensure user owns the bookmark
      .delete();

    return deletedCount > 0; // ✅ Return `true` if deleted, `false` otherwise
  } catch (error) {
    logger.error(`❌ Error deleting bookmark: ${error.message}`);
    throw new Error('Failed to delete bookmark.');
  }
}

export default {
  getBookmarks,
  createBookmark,
  deleteBookmark,
};
