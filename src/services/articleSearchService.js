import logger from '../loaders/logger.js';
import { searchArticlesInDB, storeArticlesInDB } from './articleDbService.js';
import newsApi from './newsApiService.js';

export const MIN_DB_RESULTS = 6; // Minimum articles required before fetching from API

/**
 * Searches for articles in the database and fetches additional ones from the API if needed.
 * @param {string} query - The search keyword(s).
 * @returns {Promise<Object[]>} Articles from the database or API fallback.
 */
export async function searchArticles(query) {
  if (!query) {
    throw new Error('Query parameter is required for searching news.');
  }

  // Step 1: Attempt to retrieve articles from the database
  let dbResults = await searchArticlesInDB(query);

  // Step 2: Determine if additional articles need to be fetched
  const missingArticles = MIN_DB_RESULTS - dbResults.length;
  if (missingArticles > 0) {
    logger.info(
      `⚡ Need ${missingArticles} more articles, fetching from API...`
    );

    // If needed, fetch additional articles from the external API
    const apiResults = await newsApi.searchNewsByQuery(query, missingArticles);

    // Persist new articles to the database, ensuring no duplicates
    await storeArticlesInDB(apiResults);

    // Merge database and API results for the final response
    dbResults = [...dbResults, ...apiResults.data.articles];
  }

  return dbResults;
}
export default { searchArticles };
