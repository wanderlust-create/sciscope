import knex from '../config/db.js';
import cacheService from './cacheService.js';
import logger from '../loaders/logger.js';

const MOST_BOOKMARKED_CACHE_KEY = 'most_bookmarked_articles';
const TOP_BOOKMARKING_USERS_CACHE_KEY = 'top_bookmarking_users';
const CACHE_TTL = 600; // 10 minutes

/**
 * Fetch the most bookmarked articles, with caching.
 * @param {number} limit - Number of top articles to retrieve.
 * @returns {Promise<Array>} - Most bookmarked articles.
 */
export async function getMostBookmarkedArticles(limit = 5) {
  const cachedData = cacheService.getCache(MOST_BOOKMARKED_CACHE_KEY);
  if (cachedData) return cachedData;

  const result = await knex.raw(
    `SELECT a.id, a.title, a.source_name, COUNT(ub.id) AS bookmark_count
     FROM articles a
     LEFT JOIN user_bookmarks ub ON a.id = ub.article_id
     GROUP BY a.id, a.title, a.source_name
     ORDER BY bookmark_count DESC
     LIMIT ?`,
    [limit]
  );

  const articles = result.rows;
  cacheService.setCache(MOST_BOOKMARKED_CACHE_KEY, articles, CACHE_TTL);
  logger.info(`📌 Cached most bookmarked articles for ${CACHE_TTL} seconds.`);
  return articles;
}

/**
 * Fetch the top users with the most bookmarks, with caching.
 * @param {number} limit - Number of top users to retrieve.
 * @returns {Promise<Array>} - Users who bookmarked the most articles.
 */
export async function getTopBookmarkingUsers(limit = 5) {
  const cachedData = cacheService.getCache(TOP_BOOKMARKING_USERS_CACHE_KEY);
  if (cachedData) return cachedData;

  const result = await knex.raw(
    `SELECT u.id, u.username, u.email, COUNT(ub.id) AS bookmark_count
     FROM users u
     LEFT JOIN user_bookmarks ub ON u.id = ub.user_id
     GROUP BY u.id, u.username, u.email
     ORDER BY bookmark_count DESC
     LIMIT ?`,
    [limit]
  );

  const users = result.rows;
  cacheService.setCache(TOP_BOOKMARKING_USERS_CACHE_KEY, users, CACHE_TTL);
  logger.info(`📌 Cached top bookmarking users for ${CACHE_TTL} seconds.`);
  return users;
}

export default {
  getMostBookmarkedArticles,
  getTopBookmarkingUsers,
};
