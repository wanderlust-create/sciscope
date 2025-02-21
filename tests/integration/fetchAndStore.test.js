import { jest } from '@jest/globals';
import axios from 'axios';
import db from '../../src/config/db.js';
import logger from '../../src/loaders/logger.js';
import { fetchAndStoreArticles } from '../../src/services/articleService.js';
import { generateMockArticlesResponse } from '../mocks/generateMockArticles.js';

axios.get = jest.fn();

describe('Fetch & Store Articles (Mocked API Call)', () => {
  beforeAll(async () => {
    logger.info('🔄 Initializing test database...');
    await db('articles').del();
  });

  afterAll(async () => {
    logger.info('🔻 Closing database connection...');
    await db.destroy();
  });

  it('should fetch and store only new articles without duplication', async () => {
    // ✅ Step 1: Fetch & store initial 20 articles
    const initialMockResponse = generateMockArticlesResponse(20);
    axios.get.mockResolvedValueOnce({ data: initialMockResponse });

    await fetchAndStoreArticles();

    // ✅ Fetch & sort stored articles
    let storedArticles = await db('articles').select('*');
    storedArticles.sort(
      (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)
    );

    const latestArticle = storedArticles[0] || null;
    const latestPublishedAt = latestArticle
      ? new Date(latestArticle.publishedAt)
      : null;

    logger.info('🕵️‍♂️ Latest stored article:', { latestPublishedAt });

    // ✅ Step 2: Retain 5 articles & generate 7 new ones
    const retainedArticles = storedArticles.slice(0, 5);
    const newMockResponse = generateMockArticlesResponse(7);

    // ✅ Ensure new articles have unique timestamps
    newMockResponse.articles.forEach((article, index) => {
      article.publishedAt = latestPublishedAt
        ? new Date(
            latestPublishedAt.getTime() + (index + 1) * 1000
          ).toISOString()
        : new Date().toISOString();
    });

    // ✅ Step 3: Mock API Response (5 retained + 7 new)
    axios.get.mockResolvedValueOnce({
      data: {
        status: 'ok',
        totalResults: retainedArticles.length + newMockResponse.articles.length,
        articles: [...retainedArticles, ...newMockResponse.articles],
      },
    });

    // ✅ Step 4: Fetch & store again
    await fetchAndStoreArticles();

    // ✅ Step 5: Validate final stored articles
    const finalStoredArticles = await db('articles').select('*');
    expect(finalStoredArticles.length).toBe(27); // 20 initial + 7 new

    // ✅ Validate stored URLs match expected URLs (ignoring extra fields)
    const sortedFinalStoredUrls = finalStoredArticles
      .map((article) => article.url)
      .sort();

    const sortedExpectedUrls = [
      ...initialMockResponse.articles,
      ...newMockResponse.articles,
    ]
      .map((article) => article.url)
      .sort();

    expect(sortedFinalStoredUrls).toEqual(sortedExpectedUrls);

    logger.info('✅ New articles added successfully without duplication');
  });
});
