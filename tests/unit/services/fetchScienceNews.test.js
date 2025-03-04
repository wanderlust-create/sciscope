import { jest } from '@jest/globals';
import axios from 'axios';
import db from '../../../src/config/db.js';
import logger from '../../../src/loaders/logger.js';
import {
  default as apiService,
  searchNewsByQuery,
} from '../../../src/services/apiService.js';
import { generateMockArticlesResponse } from '../../mocks/generateMockArticles.js';

const fetchScienceNews = jest.spyOn(apiService, 'fetchScienceNews');

axios.get = jest.fn();
jest.spyOn(logger, 'error').mockImplementation(() => {});
jest.spyOn(logger, 'warn').mockImplementation(() => {});

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

describe('apiService', () => {
  it('should fetch science news successfully', async () => {
    const mockApiResponse = generateMockArticlesResponse(3);
    axios.get.mockResolvedValueOnce(mockApiResponse);

    const news = await fetchScienceNews();
    console.log('News:', news);
    expect(news.status).toBe('ok');
    expect(news.articles).toHaveLength(3);
    expect(news.articles).toEqual(mockApiResponse.articles);
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('/top-headlines'),
      expect.any(Object)
    );
  });

  it('should handle API failure correctly', async () => {
    axios.get.mockRejectedValueOnce(new Error('Network Error'));

    await expect(fetchScienceNews()).rejects.toThrow(
      'Failed to fetch science news'
    );
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Error fetching science news')
    );
  });

  it('should return an empty array if no articles are found', async () => {
    axios.get.mockResolvedValueOnce({
      status: 'ok',
      totalResults: 0,
      articles: [],
    });

    const news = await fetchScienceNews();
    expect(news.articles).toEqual([]);
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      '⚠️ No articles returned from News API for science news.'
    );
  });

  it('should handle unexpected API response structure', async () => {
    axios.get.mockResolvedValueOnce({
      status: 200,
      statusText: 'OK',
      data: {}, // 🚨 Invalid API response
    });

    await expect(fetchScienceNews()).rejects.toThrow(
      'Failed to fetch science news. Unexpected response format.'
    );
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('❌ Malformed API response for science news:'),
      expect.any(Object) // Accept any object (e.g., the malformed API response)
    );
  });

  it('should handle 401 Unauthorized API key error', async () => {
    axios.get.mockResolvedValueOnce({
      status: 401,
      statusText: 'Unauthorized',
    });

    await expect(fetchScienceNews()).rejects.toThrow(
      'Invalid API key. Please verify your NEWS_API_KEY.'
    );
    expect(logger.error).toHaveBeenNthCalledWith(
      1,
      '❌ Invalid API key. Please verify your NEWS_API_KEY.'
    );
    expect(logger.error).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('❌ Error fetching science news:')
    );
  });

  it('should throw an error for non-200 API responses', async () => {
    axios.get.mockResolvedValueOnce({
      status: 500,
      statusText: 'Server Error',
    });

    await expect(fetchScienceNews()).rejects.toThrow(
      'Failed to fetch science news. API responded with 500'
    );
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining(
        '❌ Failed to fetch science news. API responded with 500'
      )
    );
  });

  it('should throw an error if search query is missing', () => {
    expect(() => apiService.searchNewsByQuery()).toThrow(
      'Query parameter is required for searching news.'
    );
  });

  it('should call fetchArticles when a valid query is provided', async () => {
    const mockApiResponse = generateMockArticlesResponse(3);
    axios.get.mockResolvedValue(mockApiResponse);

    const results = await searchNewsByQuery('NASA');
    expect(results).toEqual(mockApiResponse);
    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  it('should return an empty array if the search query yields no results', async () => {
    axios.get.mockResolvedValueOnce({
      status: 'ok',
      totalResults: 0,
      articles: [],
    });

    const results = await searchNewsByQuery('nonexistent-topic');
    expect(results.articles).toEqual([]);
    expect(axios.get).toHaveBeenCalledTimes(1);
  });
});
