import { afterEach, jest } from '@jest/globals';
import db from '../../../src/config/db.js';
import { default as apiService } from '../../../src/services/apiService.js';
import { storeArticlesInDB } from '../../../src/services/dbService.js';
import {
  MIN_DB_RESULTS,
  processQueryRequest,
} from '../../../src/services/queryService.js';
import { generateMockArticlesResponse } from '../../mocks/generateMockArticles.js';

const searchNewsByKeyword = jest.spyOn(apiService, 'searchNewsByKeyword');
const fetchArticles = jest.spyOn(apiService, 'fetchArticles');

beforeEach(async () => {
  jest.clearAllMocks();
  await db('articles').del();
});

afterEach(async () => {
  await db('articles').del();
});

afterAll(async () => {
  await db.destroy();
});

describe('Article Search Service (Unit Test)', () => {
  /**
   * ✅ Test: Ensures that when DB has enough articles, API is NOT called.
   */
  it('should return articles from DB if sufficient results exist', async () => {
    // Insert sufficient articles into the database
    const mockArticles = generateMockArticlesResponse(MIN_DB_RESULTS, 'space');
    await storeArticlesInDB(mockArticles);

    const results = await processQueryRequest('space');

    // Expect correct number of results from DB
    expect(results.articles).toHaveLength(MIN_DB_RESULTS);
    expect(searchNewsByKeyword).not.toHaveBeenCalled(); // API should NOT be triggered

    // Ensure articles contain the keyword
    results.articles.forEach((article) => {
      const text =
        `${article.title} ${article.description} ${article.content || ''}`.toLowerCase();
      expect(text).toContain('space');
    });
  });

  /**
   * ✅ Test: Ensures that if DB results are insufficient, API fetches more.
   */
  it('should fetch from API when DB results are insufficient', async () => {
    const tooFew = MIN_DB_RESULTS - 2;

    // Step 1: Insert fewer articles into DB
    const tooFewMockDbArticles = generateMockArticlesResponse(tooFew, 'krebs');
    await storeArticlesInDB(tooFewMockDbArticles);

    // Step 2: Mock API response for missing articles
    const stillNeed = MIN_DB_RESULTS - tooFew;
    const mockApiResponse = generateMockArticlesResponse(stillNeed, 'krebs');
    searchNewsByKeyword.mockResolvedValue(mockApiResponse);

    // Step 3: Process search request
    const results = await processQueryRequest('krebs');

    // Step 4: Verify total articles (DB + API)
    expect(results.total_count).toBe(MIN_DB_RESULTS);
    expect(results.articles).toHaveLength(MIN_DB_RESULTS);

    // Step 5: Ensure API was called for missing amount
    expect(searchNewsByKeyword).toHaveBeenCalledWith('krebs', stillNeed);
    expect(searchNewsByKeyword).toHaveBeenCalledTimes(1);

    // Ensure fetchArticles (low-level API fetcher) was NOT called separately
    expect(fetchArticles).not.toHaveBeenCalled();
  });

  /**
   * ✅ Test: Ensures that if no relevant DB articles exist, API provides results.
   */
  it('should return API articles even if DB is empty', async () => {
    // Step 1: Ensure database is empty
    await db('articles').del();

    // Step 2: Mock API response for a full set of articles
    const mockApiArticles = generateMockArticlesResponse(
      MIN_DB_RESULTS,
      'NASA'
    );
    searchNewsByKeyword.mockResolvedValue(mockApiArticles);

    // Step 3: Call search function
    const results = await processQueryRequest('NASA');

    // Step 4: Validate API response was used
    expect(results.articles).toHaveLength(MIN_DB_RESULTS);
    expect(searchNewsByKeyword).toHaveBeenCalledWith('NASA', MIN_DB_RESULTS);
    expect(searchNewsByKeyword).toHaveBeenCalledTimes(1);
  });
});
