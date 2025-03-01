import { jest } from '@jest/globals';
import axios from 'axios';
import db from '../../../src/config/db.js';

let cancelTokenSource;
let originalApiKey;

beforeAll(() => {
  cancelTokenSource = axios.CancelToken.source();
  originalApiKey = process.env.NEWS_API_KEY;
});

afterAll(async () => {
  cancelTokenSource.cancel('Test cleanup');
  await db.destroy();
});

beforeEach(() => {
  jest.resetModules();
});

afterEach(() => {
  process.env.NEWS_API_KEY = originalApiKey;
});

describe('Real API Call (News Service)', () => {
  it('should fetch real science news from the API', async () => {
    const { fetchScienceNews } = await import(
      '../../../src/services/newsApiService.js'
    );

    const news = await fetchScienceNews();
    const articles = news.articles;

    expect(Array.isArray(articles)).toBe(true);
    expect(articles.length).toBeGreaterThan(0);
    expect(articles[0]).toHaveProperty('title');
  });

  it('should handle API failure correctly', async () => {
    process.env.NEWS_API_KEY = 'INVALID_KEY';

    // Re-import the module so the new API key is used
    const { fetchScienceNews } = await import(
      '../../../src/services/newsApiService.js'
    );

    await expect(fetchScienceNews()).rejects.toThrow(
      'Failed to fetch science news'
    );
  });
});
