import knex from '../config/db.js';
import cacheService from './cacheService.js';
import logger from '../loaders/logger.js';
import camelcaseKeys from 'camelcase-keys';

const MOST_BOOKMARKED_CACHE_KEY = 'most_bookmarked_articles';
const MAX_CACHED_ARTICLES = 50;
const TOP_BOOKMARKING_USERS_CACHE_KEY = 'top_bookmarking_users';
const MAX_CACHED_USERS = 50;
const CACHE_TTL = 600; // 10 minutes

/**
 * Fetch the most bookmarked articles, with pagination + caching.
 * @param {number} page - Page number.
 * @param {number} limit - Items per page.
 * @returns {Promise<Array>} - Most bookmarked articles.
 */
export async function getMostBookmarkedArticles(page = 1, limit = 10) {
  let articles = cacheService.getCache(MOST_BOOKMARKED_CACHE_KEY);

  if (!articles) {
    const result = await knex.raw(
      `SELECT a.id AS article_id, a.title, a.source_name, COUNT(ub.id) AS bookmark_count
       FROM articles a
       LEFT JOIN user_bookmarks ub ON a.id = ub.article_id
       GROUP BY a.id, a.title, a.source_name
       ORDER BY bookmark_count DESC
       LIMIT ?`,
      [MAX_CACHED_ARTICLES]
    );
    const camelCasedResult = camelcaseKeys(result, { deep: true });
    articles = camelCasedResult.rows;
    cacheService.setCache(MOST_BOOKMARKED_CACHE_KEY, articles, CACHE_TTL);
    logger.info(
      `📌 Cached top ${MAX_CACHED_ARTICLES} most bookmarked articles`
    );
  }

  // Paginate from cache
  const offset = (page - 1) * limit;
  const paginated = articles.slice(offset, offset + limit);

  return paginated;
}

/**
 * Fetch the top bookmarking users, with pagination + caching.
 * @param {number} page - Page number.
 * @param {number} limit - Items per page.
 * @returns {Promise<Array>} - Top users by bookmark count.
 */

export async function getTopBookmarkingUsers(page = 1, limit = 10) {
  let users = cacheService.getCache(TOP_BOOKMARKING_USERS_CACHE_KEY);

  if (!users) {
    const result = await knex.raw(
      `SELECT u.id AS user_id, u.username, u.email, COUNT(ub.id) AS bookmark_count
       FROM users u
       LEFT JOIN user_bookmarks ub ON u.id = ub.user_id
       GROUP BY u.id, u.username, u.email
       ORDER BY bookmark_count DESC
       LIMIT ?`,
      [MAX_CACHED_USERS]
    );
    const camelCasedResult = camelcaseKeys(result, { deep: true });
    users = camelCasedResult.rows;
    cacheService.setCache(TOP_BOOKMARKING_USERS_CACHE_KEY, users, CACHE_TTL);
    logger.info(`📌 Cached top ${MAX_CACHED_USERS} bookmarking users`);
  }

  // Paginate in-memory
  const offset = (page - 1) * limit;
  const paginated = users.slice(offset, offset + limit);

  return paginated;
}

export default {
  getMostBookmarkedArticles,
  getTopBookmarkingUsers,
};
