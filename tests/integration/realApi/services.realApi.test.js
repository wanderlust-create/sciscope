import { jest } from '@jest/globals';
import axios from 'axios';
import db from '../../../src/config/db.js';
import { fetchScienceNews } from '../../../src/services/apiService.js';

let cancelTokenSource;
let originalApiKey;

beforeAll(async () => {
  cancelTokenSource = axios.CancelToken.source();
  originalApiKey = process.env.NEWS_API_KEY;
});

afterAll(async () => {
  console.log('🔻 Running global teardown...');

  // Cancel any pending API requests
  if (cancelTokenSource) {
    cancelTokenSource.cancel('Test cleanup');
    console.log('✅ Canceled pending API requests.');
  }

  // Close the database connection
  if (db && db.destroy) {
    await db.destroy();
    console.log('✅ Database connection closed.');
  }

  // Ensure Express server is closed
  if (global.__SERVER__ && typeof global.__SERVER__.close === 'function') {
    await new Promise((resolve) => global.__SERVER__.close(resolve));
    console.log('✅ Server closed.');
  }

  // Jest sometimes fails to exit due to lingering handles, so force exit.
  setTimeout(() => process.exit(0), 1000);
});

beforeEach(async () => {
  // Instead of destroying DB, clear tables
  await db.raw('TRUNCATE TABLE articles RESTART IDENTITY CASCADE');
  jest.resetModules();
});

afterEach(() => {
  process.env.NEWS_API_KEY = originalApiKey;
});

describe('SERVICE should fetch real science news from the API', () => {
  it('Real API Call (processNewsRequest)', async () => {
    const { processNewsRequest } = await import(
      '../../../src/services/newsService.js'
    );

    const news = await processNewsRequest();
    console.log('NEWS from test', news.articles.length);

    expect(typeof news).toBe('object');
    expect(news).toHaveProperty('total_count');
    expect(news).toHaveProperty('total_pages');
    expect(news).toHaveProperty('current_page');
    expect(news).toHaveProperty('articles');
    expect(news.total_count).toBeGreaterThan(0);
    expect(news.total_pages).toBeGreaterThan(0);
    expect(news.current_page).toBe(1); // or test with different pages
    expect(Array.isArray(news.articles)).toBe(true);
    expect(news.articles.length).toBeGreaterThan(0);
    const article = news.articles[0];
    expect(article).toHaveProperty('title');
    expect(article).toHaveProperty('description');
    expect(article).toHaveProperty('url');
    expect(article).toHaveProperty('publishedAt');
    expect(article).toHaveProperty('sourceName');
    expect(typeof article.title).toBe('string');
    expect(typeof article.url).toBe('string');
    expect(typeof article.publishedAt.toISOString()).toBe('string');
  });

  it('Real API Call (processQueryRequest)', async () => {
    const { processQueryRequest } = await import(
      '../../../src/services/queryService.js'
    );

    const response = await processQueryRequest('nasa');
    const { articles } = response;
    console.log('RESPONSE from test', response.articles.length);

    expect(Array.isArray(articles)).toBe(true);
    expect(articles.length).toBeGreaterThan(0);
    expect(articles[0]).toHaveProperty('title');
  });
  describe('Real API Call (Invalid API Key)', () => {
    let originalApiKey;

    beforeAll(() => {
      originalApiKey = process.env.NEWS_API_KEY;
      process.env.NEWS_API_KEY = 'INVALID_KEY'; // Temporarily use an invalid key
    });

    afterAll(() => {
      process.env.NEWS_API_KEY = originalApiKey; // Restore the original API key
    });

    it('should return an error when using an invalid API key', async () => {
      await expect(fetchScienceNews()).rejects.toThrow(
        'Invalid API key. Please verify your NEWS_API_KEY.'
      );
    });
  });
});
