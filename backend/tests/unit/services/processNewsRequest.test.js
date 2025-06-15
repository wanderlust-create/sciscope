import { jest } from '@jest/globals';
import db from '../../../src/config/db.js';
import { default as apiService } from '../../../src/services/apiService.js';
import { storeArticlesInDB } from '../../../src/services/dbService.js';
import {
  MIN_DB_RESULTS,
  processNewsRequest,
} from '../../../src/services/newsService.js';
import { generateMockArticlesResponse } from '../../mocks/generateMockArticles.js';
import { getSortedUrls } from '../../utils/testHelpers.js';
import { flushCache } from '../../../src/services/cacheService.js';
import logger from '../../../src/loaders/logger.js';

let fetchScienceNewsSpy;

beforeEach(async () => {
  await db('articles').del();
  flushCache();
  jest.clearAllMocks();
  fetchScienceNewsSpy = jest.spyOn(apiService, 'fetchScienceNews');
});

afterEach(async () => {
  await db('articles').del();
  jest.restoreAllMocks();
});

afterAll(async () => {
  await db.destroy();
});

describe('processNewsRequest', () => {
  it('should fetch and store new science articles when DB has no recent data', async () => {
    const initialStoredArticles = await db('articles').select('*');
    expect(initialStoredArticles.length).toBe(0);

    const mockApiResponse = generateMockArticlesResponse(10);
    fetchScienceNewsSpy.mockResolvedValueOnce(mockApiResponse);

    const result = await processNewsRequest();

    expect(result.articles).toHaveLength(10);
    expect(fetchScienceNewsSpy).toHaveBeenCalledTimes(1);

    const finalStoredArticles = await db('articles').select('*');
    expect(getSortedUrls(finalStoredArticles)).toEqual(
      getSortedUrls(mockApiResponse.articles)
    );
  });

  it('should return only recent DB articles without calling API', async () => {
    const mockDbArticles = generateMockArticlesResponse(
      MIN_DB_RESULTS + 1,
      null,
      true,
      false,
      3
    );
    await storeArticlesInDB(mockDbArticles);

    const storedArticles = await db('articles').select('*');
    expect(storedArticles.length).toBe(MIN_DB_RESULTS + 1);

    const result = await processNewsRequest();

    expect(result.articles).toHaveLength(MIN_DB_RESULTS + 1);
    expect(fetchScienceNewsSpy).not.toHaveBeenCalled();

    const now = new Date();
    result.articles.forEach((article) => {
      expect(new Date(article.publishedAt).getTime()).toBeGreaterThanOrEqual(
        now - 3 * 60 * 60 * 1000
      );
    });
  });

  it('should handle API failure gracefully', async () => {
    fetchScienceNewsSpy.mockReset();
    fetchScienceNewsSpy.mockRejectedValueOnce(new Error('API Error'));
    const loggerSpy = jest.spyOn(logger, 'error');

    await expect(processNewsRequest()).rejects.toThrow('API Error');

    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        '❌ Database fetch failed in fetchRecentArticles'
      ),
      expect.any(Object)
    );

    // Ensure no new data was stored in DB
    const finalStoredArticles = await db('articles').select('*');
    expect(finalStoredArticles.length).toBe(0);

    loggerSpy.mockRestore();
  });

  it('should handle empty API response gracefully', async () => {
    const loggerSpy = jest.spyOn(logger, 'info');

    fetchScienceNewsSpy.mockResolvedValueOnce({
      status: 'ok',
      totalResults: 0,
      articles: [],
    });

    const result = await processNewsRequest();

    expect(result.articles).toEqual([]);
    expect(fetchScienceNewsSpy).toHaveBeenCalledTimes(1);

    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        `⚡ Need ${MIN_DB_RESULTS} more articles, fetching from API`
      )
    );
    expect(loggerSpy).toHaveBeenCalledWith(
      '📭 No articles provided for insertion.'
    );

    const finalStoredArticles = await db('articles').select('*');
    expect(finalStoredArticles.length).toBe(0);
  });
});
