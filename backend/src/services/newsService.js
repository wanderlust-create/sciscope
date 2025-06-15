import logger from '../loaders/logger.js';
import apiService from './apiService.js';
import { flushCache, getCache, setCache } from './cacheService.js';
import dbService from './dbService.js';

export const MIN_DB_RESULTS = 6; // Minimum articles required before fetching from API
const MAX_AGE_HOURS = 300;
const CACHE_KEY = 'recent_articles';

/**
 * Fetches general science news, prioritizing database results and adding pagination.
 * @param {number} page - The requested page number.
 * @param {number} limit - The number of articles per page.
 * @param {boolean} [disableApiFallback=false] - If true, prevents fallback to external API (used in tests).
 * @returns {Promise<Object>} Paginated articles from the database or API.
 */
export async function processNewsRequest(
  page = 1,
  limit = 10,
  disableApiFallback = false
) {
  try {
    // 🔍 Try cached data first
    const cachedArticles = getCache(CACHE_KEY);

    if (Array.isArray(cachedArticles)) {
      logger.info('⚡ Cache Hit: recent_articles');
      logger.info('⚡ Serving news from cache');

      const startIdx = (page - 1) * limit;
      const paginatedArticles = cachedArticles.slice(
        startIdx,
        startIdx + limit
      );

      return {
        total_count: cachedArticles.length,
        total_pages: Math.ceil(cachedArticles.length / limit),
        current_page: page,
        articles: paginatedArticles,
      };
    } else if (cachedArticles !== undefined) {
      logger.warn('⚠️ Cached value was not an array:', cachedArticles);
    }

    logger.info('📡 Cache miss or invalid cache — checking DB...');

    // 🔎 Get recent articles from DB
    let dbResults = await dbService.fetchRecentArticles(
      MAX_AGE_HOURS,
      page,
      limit
    );

    // 💡 Set fallback threshold
    const effectiveMin = disableApiFallback
      ? 0
      : Math.min(MIN_DB_RESULTS, limit);

    const missingArticles = effectiveMin - dbResults.articles.length;

    // 📥 Fetch from external API if DB is lacking
    if (missingArticles > 0) {
      logger.info(
        `⚡ Need ${missingArticles} more articles, fetching from API...`
      );

      const apiResults = await apiService.fetchScienceNews(missingArticles);

      // 💾 Store & flush
      await dbService.storeArticlesInDB(apiResults);
      flushCache();

      dbResults = await dbService.fetchRecentArticles(
        MAX_AGE_HOURS,
        page,
        limit
      );
    }

    // ✅ Store final DB results in cache (array only)
    if (Array.isArray(dbResults.articles)) {
      setCache(CACHE_KEY, dbResults.articles, 3600); // cache for 1 hour
    } else {
      logger.warn(
        '⚠️ Skipping cache write — DB result not an array:',
        dbResults.articles
      );
    }

    return {
      ...dbResults,
      total_count: dbResults.total_count,
      total_pages: Math.ceil(dbResults.total_count / limit),
      current_page: page,
    };
  } catch (error) {
    logger.error(
      `❌ Database fetch failed in fetchRecentArticles:
    - Error Message: ${error.message}
    - Stack Trace: ${error.stack}
    - Params: maxAgeHours=${MAX_AGE_HOURS}, page=${page}, limit=${limit}`,
      {
        stack: error.stack,
      }
    );

    throw new Error(`Database error in fetchRecentArticles: ${error.message}`);
  }
}

export default { processNewsRequest, MIN_DB_RESULTS };
