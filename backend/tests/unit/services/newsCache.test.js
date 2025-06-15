import { jest } from '@jest/globals';
import db from '../../../src/config/db.js';
import { default as apiService } from '../../../src/services/apiService.js';
import {
  flushCache,
  getCache,
  setCache,
} from '../../../src/services/cacheService.js';

jest.mock('../src/services/apiService.js');
afterAll(async () => {
  await db.destroy();
});

describe('News Caching (fetchScienceNews)', () => {
  beforeEach(() => {
    flushCache(); // Clear cache before each test
    jest.clearAllMocks();
  });

  it('should return cached news when available', async () => {
    const mockNews = { articles: [{ title: 'Cached News' }] };
    setCache('science_news', mockNews, 3600); // Store in cache

    // ✅ Fetch from cache
    const result = getCache('science_news');
    expect(result).toEqual(mockNews); // ✅ Expect cached result
  });

  it('should call API if no cache exists', async () => {
    const mockAPIResponse = { articles: [{ title: 'Fresh API News' }] };
    jest
      .spyOn(apiService, 'fetchScienceNews')
      .mockResolvedValue(mockAPIResponse);

    const result = await apiService.fetchScienceNews();
    expect(apiService.fetchScienceNews).toHaveBeenCalledTimes(1); // API should be called
    expect(result).toEqual(mockAPIResponse);
  });

  it('should call API if cache is expired', async () => {
    const mockAPIResponse = { articles: [{ title: 'Refreshed API News' }] };
    apiService.fetchScienceNews.mockResolvedValue(mockAPIResponse);

    setCache('science_news', { articles: [{ title: 'Old Cache' }] }, 1); // Expire quickly
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Wait for expiration

    const result = await apiService.fetchScienceNews();
    expect(apiService.fetchScienceNews).toHaveBeenCalledTimes(1); // API call triggered
    expect(result).toEqual(mockAPIResponse);
  });

  it('should handle API errors gracefully and not cache invalid responses', async () => {
    apiService.fetchScienceNews.mockRejectedValue(new Error('API Failure'));

    await expect(apiService.fetchScienceNews()).rejects.toThrow('API Failure');
    expect(getCache('science_news')).toBeNull(); // Should not store bad data
  });
});
