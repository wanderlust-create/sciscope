import { jest } from '@jest/globals';
import request from 'supertest';
import db from '../../../src/config/db.js';
import createServer from '../../../src/loaders/server.js';
import { default as articleSearchService } from '../../../src/services/articleSearchService.js';
import { generateMockSavedArticles } from '../../mocks/generateMockSavedArticles.js';
const searchArticles = jest.spyOn(articleSearchService, 'searchArticles');

const app = createServer();
let server;

beforeAll(() => {
  server = app.listen(8080);
});

afterAll(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await db('articles').del();
  await db.destroy();
});

describe('Articles Controller', () => {
  describe('GET /api/v1/articles/search', () => {
    it('should return 200 OK and a list of articles matching the query', async () => {
      const mockedArticles = generateMockSavedArticles(6, 'mars');

      searchArticles.mockResolvedValue(mockedArticles);

      const response = await request(app).get(
        '/api/v1/articles/search?query=mars'
      );
      console.log('Response:', response.body);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const article = response.body[0];
      expect(article).toHaveProperty('source.name');
      expect(article).toHaveProperty('title');
      expect(article).toHaveProperty('url');
      expect(article).toHaveProperty('publishedAt');

      // Ensure searchArticles was called exactly once
      expect(searchArticles).toHaveBeenCalledTimes(1);
      expect(searchArticles).toHaveBeenCalledWith('mars');
    });

    it('should return 500 Internal Server Error when the search fails', async () => {
      searchArticles.mockRejectedValueOnce(new Error('Search Error'));

      const response = await request(app).get(
        '/api/v1/articles/search?query=mars'
      );
      expect(response.status).toBe(500);
      expect(response.body).toStrictEqual({ error: 'Internal Server Error' });
    });
  });
});
