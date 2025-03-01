import { jest } from '@jest/globals';
import db from '../../src/config/db.js';
import logger from '../../src/loaders/logger.js';
import { storeArticlesInDB } from '../../src/services/articleDbService.js';
import { fetchGeneralScienceNews } from '../../src/services/generalNewsService.js';
import { default as newsApiService } from '../../src/services/newsApiService.js';
import { generateMockArticlesResponse } from '../mocks/generateMockArticles.js';

const fetchScienceNews = jest.spyOn(newsApiService, 'fetchScienceNews');

beforeEach(async () => {
  await db('articles').del();
  jest.clearAllMocks();
});

afterEach(async () => {
  await db('articles').del();
});

afterAll(async () => {
  await db.destroy();
});

describe('fetchGeneralScienceNews', () => {
  it('should fetch and cache new science articles when DB has no recent data', async () => {
    const initialStoredArticles = await db('articles').select('*');
    expect(initialStoredArticles.length).toBe(0);

    const mockApiResponse = generateMockArticlesResponse(10);
    fetchScienceNews.mockResolvedValueOnce(mockApiResponse);

    const results = await fetchGeneralScienceNews();
    expect(results).toHaveLength(10);
    expect(fetchScienceNews).toHaveBeenCalledTimes(1);

    const finalStoredArticles = await db('articles').select('*');
    expect(finalStoredArticles.length).toBe(10);

    // Validate stored URLs match expected URLs
    const sortedFinalStoredUrls = finalStoredArticles
      .map((article) => article.url)
      .sort();
    const sortedExpectedUrls = [...mockApiResponse.articles]
      .map((article) => article.url)
      .sort();
    expect(sortedFinalStoredUrls).toEqual(sortedExpectedUrls);
  });

  it('should return only articles published within the defined timeframe (no API call)', async () => {
    const mockDbArticles = generateMockArticlesResponse(
      5,
      null,
      true,
      false,
      3 // ⬅ Ensures articles are "recent" within the last 3 hours
    );
    await storeArticlesInDB(mockDbArticles);

    const storedArticles = await db('articles').select('*');
    expect(storedArticles.length).toBe(5);

    // Ensure returned articles are actually within the time limit
    const results = await fetchGeneralScienceNews();
    expect(results).toHaveLength(5);
    expect(fetchScienceNews).not.toHaveBeenCalled();

    // Check that all articles are within the last 3 hours
    const now = new Date();
    results.forEach((article) => {
      expect(new Date(article.publishedAt).getTime()).toBeGreaterThanOrEqual(
        now - 3 * 60 * 60 * 1000 // 3 hours ago in milliseconds
      );
    });
  });

  it('should handle API failure and return an error', async () => {
    const loggerSpy = jest.spyOn(logger, 'error');
    fetchScienceNews.mockRejectedValueOnce(new Error('API Error'));

    await expect(fetchGeneralScienceNews()).rejects.toThrow(
      'Failed to fetch general science news.'
    );

    // Ensure the error is logged
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        '❌ Error fetching general science news: API Error'
      ),
      expect.any(Object) // Allows for additional log metadata
    );

    // Ensure no new data was stored in DB
    const finalStoredArticles = await db('articles').select('*');
    expect(finalStoredArticles.length).toBe(0);

    loggerSpy.mockRestore();
  });

  it('should handle an empty API response gracefully', async () => {
    const loggerSpy = jest.spyOn(logger, 'info');
    fetchScienceNews.mockResolvedValueOnce({ articles: [] });
    const results = await fetchGeneralScienceNews();

    expect(results).toEqual([]);
    expect(fetchScienceNews).toHaveBeenCalledTimes(1);

    // Ensure no data was stored in DB
    const finalStoredArticles = await db('articles').select('*');
    expect(finalStoredArticles.length).toBe(0);
    // Ensure the correct logger message was logged
    expect(loggerSpy).toHaveBeenCalledWith(
      '📭 No articles provided for insertion.'
    );

    loggerSpy.mockRestore();
  });
});
