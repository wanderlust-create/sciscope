import { jest } from '@jest/globals';
import request from 'supertest';
import db from '../../../../src/config/db.js';
import createServer from '../../../../src/loaders/server.js';
import { default as queryService } from '../../../../src/services/queryService.js';
import { generateMockArticlesResponse } from '../../../mocks/generateMockArticles.js';
const processQueryRequest = jest.spyOn(queryService, 'processQueryRequest');

const app = createServer();
let server;

beforeAll(() => {
  server = app.listen(0);
});

beforeEach(async () => {
  await db('articles').del();
  jest.clearAllMocks();
});

afterAll(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
    console.log('✅ Server closed.');
  }

  await db('articles').del();
  await db.destroy();
});

describe('Articles Controller', () => {
  describe('GET /api/v1/search', () => {
    it('should return 200 OK and a list of articles matching the query', async () => {
      const mockRecentArticles = generateMockArticlesResponse(
        6, // number of articles
        'mars', // keyword
        true, //IsNew
        false, // IsOld
        3 // max age hours
      );

      processQueryRequest.mockResolvedValue(mockRecentArticles);

      const response = await request(app).get('/api/v1/search?keyword=mars');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.articles)).toBe(true);
      expect(response.body.totalResults).toBe(6);
      expect(response.body.articles.length).toBe(6);
      expect(processQueryRequest).toHaveBeenCalledTimes(1);

      const article = response.body.articles[0];
      expect(article).toHaveProperty('source.name');
      expect(article).toHaveProperty('title');
      expect(article).toHaveProperty('url');
      expect(article).toHaveProperty('publishedAt');

      // Ensure processQueryRequest was called exactly once
      expect(processQueryRequest).toHaveBeenCalledTimes(1);
      expect(processQueryRequest).toHaveBeenCalledWith('mars', 1, 10);
    });

    it('should return 400 Bad Request when no keyword is provided', async () => {
      const response = await request(app).get('/api/v1/search');
      expect(response.status).toBe(400);
      expect(response.body).toStrictEqual({
        error: 'Keyword parameter is required.',
      });
    });

    it('should return 500 Internal Server Error when the search fails', async () => {
      processQueryRequest.mockRejectedValueOnce(new Error('Search Error'));

      const response = await request(app).get('/api/v1/search?keyword=mars');
      expect(response.status).toBe(500);
      expect(response.body).toStrictEqual({ error: 'Internal Server Error' });
    });
  });
});
