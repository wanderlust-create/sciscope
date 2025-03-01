import logger from '../loaders/logger.js';
import { fetchRecentArticles, storeArticlesInDB } from './articleDbService.js';
import newsApi from './newsApiService.js';

const MAX_AGE_HOURS = 3; // Consider articles "fresh" if they're within the last 3 hours.

/**
 * Fetches general science news, prioritizing database results to reduce API calls.
 * @returns {Promise<Object[]>} Science news articles.
 */
export async function fetchGeneralScienceNews() {
  try {
    logger.info('🔎 Checking database for recent science news...');

    // Step 1: Check if we have recent articles in the database
    const recentArticles = await fetchRecentArticles(MAX_AGE_HOURS, 10);

    if (recentArticles.length > 0) {
      logger.info(
        `✅ Found ${recentArticles.length} recent articles in DB. Returning from cache.`
      );
      return recentArticles;
    }

    // Step 2: If not enough recent articles, fetch fresh ones from the API
    logger.info('📡 No recent articles found. Fetching fresh news from API...');
    const apiResults = await newsApi.fetchScienceNews();

    // Step 3: Store fresh API articles in the DB for future use
    await storeArticlesInDB(apiResults);

    return apiResults.articles;
  } catch (error) {
    logger.error(`❌ Error fetching general science news: ${error.message}`, {
      stack: error.stack,
    });
    throw new Error('Failed to fetch general science news.');
  }
}

export default { fetchGeneralScienceNews };
