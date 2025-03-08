import logger from '../loaders/logger.js';
import newsApiService from './apiService.js';
import { searchArticlesInDB, storeArticlesInDB } from './dbService.js';

export const MIN_DB_RESULTS = 6; // Minimum articles required before fetching from API

/**
 * Searches for articles in the database and fetches additional ones from the API if needed.
 * @param {string} keyword - The search keyword(s).
 * @returns {Promise<Object[]>} Articles from the database or API fallback.
 */
export async function processQueryRequest(keyword, page = 1, limit = 10) {
  let finalTotalCount = 0;
  if (!keyword) {
    throw new Error('Keyword parameter is required for searching news.');
  }

  // Step 1: Retrieve paginated articles from the database
  let dbResults = await searchArticlesInDB(keyword, page, limit);
  let origTotalCount = dbResults.total_count; // Initial DB count

  // Step 2: Determine if additional articles need to be fetched
  const missingArticles = MIN_DB_RESULTS - origTotalCount;
  if (missingArticles > 0) {
    logger.info(
      `⚡ Need ${missingArticles} more articles, fetching from API...`
    );

    // Fetch additional articles from the external API
    const apiResults = await newsApiService.searchNewsByKeyword(
      keyword,
      missingArticles
    );

    // Store new articles in the database
    await storeArticlesInDB(apiResults);

    // Re-fetch updated DB results to get the most recent count
    dbResults = await searchArticlesInDB(keyword, page, limit);

    // ✅ Update finalTotalCount **only if more articles were fetched**
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
}

export default { processQueryRequest };
