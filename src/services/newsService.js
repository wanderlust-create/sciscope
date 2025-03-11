import logger from '../loaders/logger.js';
import apiService from './apiService.js';
import { fetchRecentArticles, storeArticlesInDB } from './dbService.js';

export const MIN_DB_RESULTS = 6; // Minimum articles required before fetching from API
const MAX_AGE_HOURS = 300;

/**
 * Fetches general science news, prioritizing database results and adding pagination.
 * @param {number} page - The requested page number.
 * @param {number} limit - The number of articles per page.
 * @returns {Promise<Object>} Paginated articles from the database or API.
 */
export async function processNewsRequest(page = 1, limit = 10) {
  let finalTotalCount = 0;
  try {
    logger.info('Checking database for recent science news...');

    // Retrieve paginated recent articles from the database
    let dbResults = await fetchRecentArticles(MAX_AGE_HOURS, page, limit);
    let origTotalCount = dbResults.total_count || 0;

    // Determine if additional articles need to be fetched
    const missingArticles = MIN_DB_RESULTS - origTotalCount;
    if (missingArticles > 0) {
      logger.info(
        `⚡ Need ${missingArticles} more articles, fetching from API...`
      );

      // Fetch additional articles from the external API
      const apiResults = await apiService.fetchScienceNews(missingArticles);

      // Store new articles in the database
      await storeArticlesInDB(apiResults);

      // Re-fetch updated DB results to get the most recent count
      dbResults = await fetchRecentArticles(MAX_AGE_HOURS, page, limit);

      // Update finalTotalCount **only if more articles were fetched**
      finalTotalCount = Math.min(
        origTotalCount + apiResults.articles.length,
        100
      );
    } else {
      finalTotalCount = origTotalCount; // ✅ Keep the original total if no API fetch
    }

    return {
      ...dbResults,
      total_count: finalTotalCount,
      total_pages: Math.ceil(finalTotalCount / limit),
      current_page: page,
    };
  } catch (error) {
    logger.error(`❌ Error fetching general science news: ${error.message}`, {
      stack: error.stack,
    });

    // Preserve and rethrow the original error message
    throw new Error(error.message || 'Failed to fetch general science news.');
  }
}

export default { processNewsRequest, MIN_DB_RESULTS };
