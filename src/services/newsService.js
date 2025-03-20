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
 * @returns {Promise<Object>} Paginated articles from the database or API.
 */
export async function processNewsRequest(page = 1, limit = 10) {
  try {
    // Check cache first
    const cachedArticles = getCache(CACHE_KEY);
    if (cachedArticles) {
      logger.info('⚡ Serving news from cache');

      // ✅ Apply pagination dynamically
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
    }
    logger.info('Checking database for recent science news...');

    // Retrieve paginated recent articles from the database
    let dbResults = await dbService.fetchRecentArticles(
      MAX_AGE_HOURS,
      page,
      limit
    );

    // Determine if additional articles are needed
    const missingArticles = MIN_DB_RESULTS - dbResults.articles.length;
    if (missingArticles > 0) {
      logger.info(
        `⚡ Need ${missingArticles} more articles, fetching from API...`
      );

      // Fetch additional articles from API
      const apiResults = await apiService.fetchScienceNews(missingArticles);
      // Store new articles in DB & clear cache
      await dbService.storeArticlesInDB(apiResults);
      flushCache(); // ✅ Clear cache when new articles are added

      // Re-fetch updated DB results
      dbResults = await dbService.fetchRecentArticles(
        MAX_AGE_HOURS,
        page,
        limit
      );
    }

    // Cache the final DB response
    setCache(CACHE_KEY, dbResults, 3600); // Store for 1 hour

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
