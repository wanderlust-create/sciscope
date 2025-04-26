import { jest } from '@jest/globals';
import db from '../../../src/config/db.js';
import { default as apiService } from '../../../src/services/apiService.js';
import {
  default as cacheService,
  flushCache,
  getCache,
  setCache,
} from '../../../src/services/cacheService.js';
import {
  default as dbService,
  storeArticlesInDB,
} from '../../../src/services/dbService.js';
import {
  MIN_DB_RESULTS,
  processNewsRequest,
} from '../../../src/services/newsService.js';
import { generateMockArticlesResponse } from '../../mocks/generateMockArticles.js';
import { getSortedUrls } from '../../utils/testHelpers.js';
import logger from '../../../src/loaders/logger.js';

beforeEach(async () => {
  await db('articles').del();
  flushCache();
  jest.clearAllMocks();
});

afterEach(async () => {
  await db('articles').del();
  jest.restoreAllMocks();
});

afterAll(async () => {
  await db.destroy();
});

describe('News Caching (Database Articles)', () => {
  const CACHE_KEY = 'recent_articles';

  it('should return cached DB articles when available', async () => {
    flushCache();
    const fetchRecentArticlesSpy = jest.spyOn(dbService, 'fetchRecentArticles');

    // 🔹 Step 1: Store mock articles in the DB so they are formatted correctly
    const mockArticles = generateMockArticlesResponse(25);
    await storeArticlesInDB(mockArticles);
    const articlesInDb = await db('articles').select('*');

    setCache(CACHE_KEY, articlesInDb, 3600);

    const result = await processNewsRequest(1, 6);

    // Validate that the function returns cached results
    expect(getCache(CACHE_KEY)).toEqual(articlesInDb); // ✅ Cache should return formatted DB articles

    // Ensure DB **was NOT queried** because cache existed
    expect(fetchRecentArticlesSpy).not.toHaveBeenCalled();

    expect(result).toEqual({
      total_count: articlesInDb.length,
      total_pages: Math.ceil(articlesInDb.length / 6),
      current_page: 1,
      articles: articlesInDb.slice(0, 6),
    });
  });

  it('should fetch from DB and cache results if cache is empty', async () => {
    flushCache();
    const fetchRecentArticlesSpy = jest.spyOn(dbService, 'fetchRecentArticles');

    const mockDBArticles = generateMockArticlesResponse(MIN_DB_RESULTS);
    await storeArticlesInDB(mockDBArticles);

    const result = await processNewsRequest(1, 6);
    // Cache should now store the DB results
    console.log('Cache after processNewsRequest:', getCache(CACHE_KEY));
    expect(getSortedUrls(getCache(CACHE_KEY))).toEqual(
      getSortedUrls(mockDBArticles.articles)
    );
    expect(getSortedUrls(result.articles)).toEqual(
      getSortedUrls(mockDBArticles.articles)
    );

    expect(fetchRecentArticlesSpy).toHaveBeenCalledTimes(1); // Should query DB
  });

  it('should fetch fresh data when cache expires', async () => {
    flushCache();
    const fetchRecentArticlesSpy = jest.spyOn(dbService, 'fetchRecentArticles');
    const loggerSpy = jest.spyOn(logger, 'info');

    const mockDBArticles = generateMockArticlesResponse(12);
    await storeArticlesInDB(mockDBArticles);
    setCache(
      CACHE_KEY,
      { totalCount: 5, articles: [{ title: 'Old Cache' }] },
      1
    ); // ✅ Expire quickly

    await new Promise((resolve) => setTimeout(resolve, 1500)); // Wait for expiration

    const result = await processNewsRequest(1, 12);

    expect(loggerSpy).toHaveBeenCalledWith('❌ Cache Miss: recent_articles'); // Ensure cache miss was logged
    expect(fetchRecentArticlesSpy).toHaveBeenCalledTimes(1); // Should query DB after cache expiry

    expect(getSortedUrls(getCache(CACHE_KEY))).toEqual(
      getSortedUrls(mockDBArticles.articles)
    );
    expect(getSortedUrls(result.articles)).toEqual(
      getSortedUrls(mockDBArticles.articles)
    );
  });

  it('should not cache results if DB fetch fails', async () => {
    flushCache();
    const fetchRecentArticlesSpy = jest.spyOn(dbService, 'fetchRecentArticles');
    const loggerSpy = jest.spyOn(logger, 'error');
    const flushCacheSpy = jest.spyOn(cacheService, 'flushCache');

    fetchRecentArticlesSpy.mockRejectedValue(new Error('DB Failure'));

    await expect(processNewsRequest(1, 5)).rejects.toThrow('DB Failure');

    expect(getCache(CACHE_KEY)).toBeNull(); // Cache should NOT store error data
    expect(flushCacheSpy).not.toHaveBeenCalled(); // Cache should NOT be cleared
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        '❌ Database fetch failed in fetchRecentArticles:'
      ),
      expect.any(Object)
    );

    loggerSpy.mockRestore();
  });

  it('should return articles from DB if available, even if API call is made', async () => {
    flushCache();

    const fetchRecentArticlesSpy = jest.spyOn(dbService, 'fetchRecentArticles');

    // Mock DB with fewer articles than needed
    const mockDBArticles = generateMockArticlesResponse(MIN_DB_RESULTS - 2);
    await storeArticlesInDB(mockDBArticles);

    // Mock API response with additional articles
    const mockApiResponse = generateMockArticlesResponse(5);
    const fetchScienceNewsSpy = jest
      .spyOn(apiService, 'fetchScienceNews')
      .mockResolvedValue(mockApiResponse);

    const result = await processNewsRequest(1, 11);

    expect(fetchRecentArticlesSpy).toHaveBeenCalledTimes(2); // DB queried before & after API fetch
    expect(fetchScienceNewsSpy).toHaveBeenCalledTimes(1); // Should call API

    // Ensure cache and result contain **both** DB + API articles
    expect(getSortedUrls(getCache(CACHE_KEY))).toEqual(
      getSortedUrls(result.articles) // Cache should match DB articles
    );
    expect(getSortedUrls(result.articles)).toEqual(
      getSortedUrls([...mockDBArticles.articles, ...mockApiResponse.articles])
    ); // Results should combine DB and API articles
  });
});
