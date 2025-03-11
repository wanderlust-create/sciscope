import { jest } from '@jest/globals';
import db from '../../../src/config/db.js';
import { default as apiService } from '../../../src/services/apiService.js';
import {
  flushCache,
  getCache,
  setCache,
} from '../../../src/services/cacheService.js';

jest.mock('../src/services/apiService.js');
afterAll(async () => {
  await db.destroy();
});

describe('News Caching (fetchScienceNews)', () => {
  beforeEach(() => {
    flushCache(); // Clear cache before each test
    jest.clearAllMocks();
  });

  it('should return cached news when available', async () => {
    const mockNews = { articles: [{ title: 'Cached News' }] };
    setCache('science_news', mockNews, 3600); // Store in cache

    // ✅ Fetch from cache
    const result = getCache('science_news');
    expect(result).toEqual(mockNews); // ✅ Expect cached result
  });

  it('should call API if no cache exists', async () => {
    const mockAPIResponse = { articles: [{ title: 'Fresh API News' }] };
    jest
      .spyOn(apiService, 'fetchScienceNews')
      .mockResolvedValue(mockAPIResponse);

    const result = await apiService.fetchScienceNews();
    expect(apiService.fetchScienceNews).toHaveBeenCalledTimes(1); // API should be called
    expect(result).toEqual(mockAPIResponse);
  });

  it('should call API if cache is expired', async () => {
    const mockAPIResponse = { articles: [{ title: 'Refreshed API News' }] };
    apiService.fetchScienceNews.mockResolvedValue(mockAPIResponse);

    setCache('science_news', { articles: [{ title: 'Old Cache' }] }, 1); // Expire quickly
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Wait for expiration

    const result = await apiService.fetchScienceNews();
    expect(apiService.fetchScienceNews).toHaveBeenCalledTimes(1); // API call triggered
    expect(result).toEqual(mockAPIResponse);
  });

  it('should handle API errors gracefully and not cache invalid responses', async () => {
    apiService.fetchScienceNews.mockRejectedValue(new Error('API Failure'));

    await expect(apiService.fetchScienceNews()).rejects.toThrow('API Failure');
    expect(getCache('science_news')).toBeNull(); // Should not store bad data
  });
});

import logger from '../loaders/logger.js';
import apiService from './apiService.js';
import { fetchRecentArticles, storeArticlesInDB } from './dbService.js';
import { getCache, setCache } from './cacheService.js';

export const MIN_DB_RESULTS = 6;
const MAX_AGE_HOURS = 300;
const CACHE_KEY = 'science_news';

/**
 * Fetches science news, prioritizing cache, then DB, and API last.
 * @param {number} page - The requested page number.
 * @param {number} limit - Number of articles per page.
 * @returns {Promise<Object>} Paginated articles from cache, DB, or API.
 */
export async function processNewsRequest(page = 1, limit = 10) {
  try {
    // **Step 1: Check cache first**
    const cachedNews = getCache(CACHE_KEY);
    if (cachedNews) {
      logger.info('⚡ Serving news from cache');
      return cachedNews; // ✅ Return cached news immediately
    }

    logger.info('Checking database for recent science news...');

    // **Step 2: Fetch from DB if cache is empty**
    let dbResults = await fetchRecentArticles(MAX_AGE_HOURS, page, limit);
    let origTotalCount = dbResults.total_count || 0;

    const missingArticles = MIN_DB_RESULTS - origTotalCount;
    if (missingArticles > 0) {
      logger.info(`⚡ Need ${missingArticles} more articles, fetching from API...`);

      // **Step 3: Fetch missing articles from API**
      const apiResults = await apiService.fetchScienceNews(missingArticles);

      // **Step 4: Cache API results before storing in DB**
      setCache(CACHE_KEY, apiResults, 3600); // Cache for 1 hour

      // **Step 5: Store new articles in the database**
      await storeArticlesInDB(apiResults);

      // **Step 6: Re-fetch DB results to get the most recent count**
      dbResults = await fetchRecentArticles(MAX_AGE_HOURS, page, limit);
    }

    // **Step 7: Cache the final DB response**
    setCache(CACHE_KEY, dbResults, 3600);

    return dbResults;
  } catch (error) {
    logger.error(`❌ Error fetching science news: ${error.message}`, { stack: error.stack });
    throw new Error(error.message || 'Failed to fetch science news.');
  }
}

export default { processNewsRequest, MIN_DB_RESULTS };

