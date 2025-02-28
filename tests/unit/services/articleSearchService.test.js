import { jest } from '@jest/globals';
import db from '../../../src/config/db.js';
import { storeArticlesInDB } from '../../../src/services/articleDbService.js';
import {
  MIN_DB_RESULTS,
  searchArticles,
} from '../../../src/services/articleSearchService.js';
import { default as newsApiService } from '../../../src/services/newsApiService.js';
import { generateMockArticlesResponse } from '../../mocks/generateMockArticles.js';
const searchNewsByQuery = jest.spyOn(newsApiService, 'searchNewsByQuery');
const fetchArticles = jest.spyOn(newsApiService, 'fetchArticles');

beforeEach(async () => {
  jest.clearAllMocks();
  await db('articles').del();
});

afterAll(async () => {
  await db.destroy();
});

describe('Article Search Service (Unit Test)', () => {
  /**
   * ✅ Test: Ensures that when sufficient articles exist in the DB,
   * the system does NOT call the external API and only returns DB results.
   */
  it('should return articles from DB if sufficient results exist', async () => {
    // Insert sufficient articles into the database
    const mockArticles = generateMockArticlesResponse(MIN_DB_RESULTS, 'space');
    await storeArticlesInDB(mockArticles);

    const results = await searchArticles('space');

    // Expect correct number of results from DB
    expect(results).toHaveLength(MIN_DB_RESULTS);
    expect(searchNewsByQuery).not.toHaveBeenCalled(); // API call should NOT be triggered

    // Ensure each article contains the expected keyword
    results.forEach((article) => {
      const text =
        `${article.title} ${article.description} ${article.content || ''}`.toLowerCase();
      expect(text).toContain('space');
    });
  });

  /**
   * ✅ Test: Ensures that when DB results are insufficient,
   * the system fetches missing articles from the external API.
   */
  it('should fetch from API when DB results are insufficient', async () => {
    const tooFew = 4;
    // Step 1: Insert fewer than the minimum required articles into DB
    const tooFewMockDbArticles = generateMockArticlesResponse(tooFew, 'krebs');
    await storeArticlesInDB(tooFewMockDbArticles);

    // Step 2: Mock API response to provide missing articles
    const stillNeed = MIN_DB_RESULTS - tooFew;
    const mockApiResponse = generateMockArticlesResponse(stillNeed, 'krebs');
    searchNewsByQuery.mockResolvedValue(mockApiResponse);

    const results = await searchArticles('krebs');

    // Step 4: Verify total articles (DB + API)
    expect(results).toHaveLength(MIN_DB_RESULTS);

    // Step 5: Ensure the external API was called to fetch exactly the missing amount
    expect(searchNewsByQuery).toHaveBeenCalledWith('krebs', stillNeed);
    expect(searchNewsByQuery).toHaveBeenCalledTimes(1);

    // Ensure fetchArticles (low-level API fetcher) was NOT called separately
    expect(fetchArticles).not.toHaveBeenCalled();
  });

  /**
   * ✅ Test: Ensures that when no relevant articles exist in the database,
   * the system fetches articles entirely from the external API.
   */
  it('should return API articles even if DB is empty', async () => {
    // Step 1: Ensure database is empty
    await db('articles').del();

    // Step 2: Mock API response for a full set of articles
    const mockApiArticles = generateMockArticlesResponse(
      MIN_DB_RESULTS,
      'NASA'
    );
    searchNewsByQuery.mockResolvedValue(mockApiArticles);

    // Step 3: Call search function
    const results = await searchArticles('NASA');

    // Step 4: Validate API response was used as the data source
    expect(results).toHaveLength(MIN_DB_RESULTS);
    expect(searchNewsByQuery).toHaveBeenCalledWith('NASA', MIN_DB_RESULTS);
    expect(searchNewsByQuery).toHaveBeenCalledTimes(1);
  });
});
