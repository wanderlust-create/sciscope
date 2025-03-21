import logger from '../loaders/logger.js';
import Article from '../models/Article.js';
import Bookmark from '../models/Bookmark.js';
import { applyPagination } from '../utils/pagination.js';
import cacheService from '../services/cacheService.js';

const MOST_BOOKMARKED_CACHE_KEY = 'most_bookmarked_articles';
const TOP_BOOKMARKING_USERS_CACHE_KEY = 'top_bookmarking_users';

/**
 * Retrieves all bookmarks for a specific user.
 * @param {number} userId - The user's ID.
 * @param {number} [page=1] - Page number for pagination (default: 1).
 * @param {number} [limit=10] - Number of bookmarks per page (default: 10).
 * @returns {Promise<Array>} - List of bookmarked articles.
 */
export async function getBookmarks(userId, page = 1, limit = 10) {
  try {
    const total = await Bookmark.query()
      .where({ user_id: userId })
      .resultSize();

    const paginatedBookmarks = await applyPagination(
      Bookmark.query()
        .where({ user_id: userId })
        .withGraphFetched('article')
        .orderBy('bookmarked_at', 'desc'),
      { page, limit }
    );

    return { total, bookmarks: paginatedBookmarks };
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

    // Insert the bookmark
    const bookmark = await Bookmark.query()
      .insert({ user_id: userId, article_id: articleId })
      .returning('*');

    // ✅ Purge cache after adding a bookmark
    cacheService.delCache(MOST_BOOKMARKED_CACHE_KEY);
    cacheService.delCache(TOP_BOOKMARKING_USERS_CACHE_KEY);
    logger.info(
      `🗑️ Cache purged after new bookmark (User: ${userId}, Article: ${articleId})`
    );

    return bookmark;
  } catch (error) {
    logger.error(`❌ Error creating bookmark: ${error.message}`);
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
      .where({ id, user_id: userId })
      .delete();

    if (deletedCount > 0) {
      // ✅ Purge cache after deleting a bookmark
      cacheService.delCache(MOST_BOOKMARKED_CACHE_KEY);
      cacheService.delCache(TOP_BOOKMARKING_USERS_CACHE_KEY);
      logger.info(
        `🗑️ Cache purged after bookmark deletion (User: ${userId}, Bookmark ID: ${id})`
      );

      return true;
    }
    return false;
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
