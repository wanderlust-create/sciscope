import axios from 'axios';
import db from '../../../src/config/db.js';
import { fetchScienceNews } from '../../../src/services/newsService.js';

let cancelTokenSource;
beforeAll(() => {
  cancelTokenSource = axios.CancelToken.source();
});

afterAll(async () => {
  cancelTokenSource.cancel('Test cleanup'); // ✅ Cancel any pending requests
  await db.destroy(); // ✅ Properly close DB connection
});

describe('Real API Call (News Service)', () => {
  it('should fetch real science news from the API', async () => {
    const news = await fetchScienceNews();
    expect(Array.isArray(news)).toBe(true);
    expect(news.length).toBeGreaterThan(0);
    expect(news[0]).toHaveProperty('title');
  });

  it('should handle API failure correctly', async () => {
    const originalApiKey = process.env.NEWS_API_KEY;
    process.env.NEWS_API_KEY = 'INVALID_KEY';

    await expect(fetchScienceNews()).rejects.toThrow('Failed to fetch news');

    process.env.NEWS_API_KEY = originalApiKey;
  });
});
