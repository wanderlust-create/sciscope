import logger from '../loaders/logger.js';
import apiService from './apiService.js';
import dbService from './dbService.js';
import { flushCache, getCache, setCache } from './cacheService.js';

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
  let finalTotalCount = 0;
  console.log('Process news request!!!');
  try {
    // Check cache first
    const cachedArticles = getCache(CACHE_KEY);
    if (cachedArticles) {
      logger.info('⚡ Serving news from cache');
      return cachedArticles;
    }
    console.log('cachedArticles:', cachedArticles);
    logger.info('Checking database for recent science news...');

    // Retrieve paginated recent articles from the database
    let dbResults = await dbService.fetchRecentArticles(
      MAX_AGE_HOURS,
      page,
      limit
    );
    let origTotalCount = dbResults.total_count || 0;

    // Determine if additional articles are needed
    const missingArticles = MIN_DB_RESULTS - origTotalCount;
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

    // Return final results
    finalTotalCount = Math.min(
      origTotalCount + (dbResults?.articles?.length || 0),
      100
    );

    return {
      ...dbResults,
      total_count: finalTotalCount,
      total_pages: Math.ceil(finalTotalCount / limit),
      current_page: page,
    };
  } catch (error) {
    logger.error(`❌ Error fetching science news: ${error.message}`, {
      stack: error.stack,
    });
    throw new Error(error.message || 'Failed to fetch science news.');
  }
}

export default { processNewsRequest, MIN_DB_RESULTS };
