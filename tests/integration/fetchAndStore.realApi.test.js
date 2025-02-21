import axios from 'axios';
import db from '../../src/config/db.js';
import logger from '../../src/loaders/logger.js';
import { fetchAndStoreArticles } from '../../src/services/articleService.js';

describe('Fetch & Store Articles (Real API Call)', () => {
  let cancelTokenSource;

  beforeAll(async () => {
    cancelTokenSource = axios.CancelToken.source();

    logger.info('🔄 Initializing database connection...');
    await db.raw('SELECT 1');

    logger.info('🧹 Clearing test data...');
    await db('articles').del();

    logger.info('🌍 Fetching & storing articles from real API...');
    await fetchAndStoreArticles();
  });

  afterAll(async () => {
    logger.info('🔻 Closing database connection...');
    cancelTokenSource.cancel('Test cleanup');
    await db.destroy();
  });

  it('should fetch real science news and store them in the database', async () => {
    const storedArticles = await db('articles').select('*');

    logger.info({
      message: `✅ ${storedArticles.length} Articles fetched from DB`,
    });

    expect(storedArticles.length).toBeGreaterThan(0);

    const firstArticle = storedArticles[0];

    // ✅ Ensure the database fields use snake_case
    expect(firstArticle).toHaveProperty('title');
    expect(firstArticle).toHaveProperty('description');
    expect(firstArticle).toHaveProperty('url');
    expect(firstArticle).toHaveProperty('urlToImage');
    expect(firstArticle).toHaveProperty('publishedAt');
    expect(firstArticle).toHaveProperty('authorName');
    expect(firstArticle).toHaveProperty('sourceName');

    // ✅ Ensure API response didn't store invalid data
    storedArticles.forEach((article) => {
      expect(article.url).toBeTruthy();
      expect(article.publishedAt).toBeTruthy();
    });
  });
});
