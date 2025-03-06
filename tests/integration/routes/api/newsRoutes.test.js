import { jest } from '@jest/globals';
import request from 'supertest';
import db from '../../../../src/config/db.js';
import createServer from '../../../../src/loaders/server.js';
import { default as newsService } from '../../../../src/services/newsService.js';
import { generateMockArticlesResponse } from '../../../mocks/generateMockArticles.js';

const processNewsRequest = jest.spyOn(newsService, 'processNewsRequest');

const app = createServer();
let server;

beforeAll(() => {
  server = app.listen(8080);
});

afterAll(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
    console.log('✅ Server closed.');
  }

  await db('articles').del();
  await db.destroy();
});

describe('News Controller', () => {
  describe('GET /api/v1/news', () => {
    it('should return 200 OK and a list of only recent science news articles', async () => {
      const now = new Date();
      const mockRecentArticles = generateMockArticlesResponse(
        6,
        null,
        true,
        false,
        3 // ⬅ Ensures articles are "recent" within the last 3 hours
      );

      processNewsRequest.mockResolvedValue(mockRecentArticles);

      const response = await request(app).get(`/api/v1/news`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.articles)).toBe(true);
      expect(response.body.articles.length).toBe(6);
      expect(processNewsRequest).toHaveBeenCalledTimes(1);

      // Verify all articles are within the 3-hour timeframe
      response.body.articles.forEach((article) => {
        expect(new Date(article.publishedAt).getTime()).toBeGreaterThanOrEqual(
          now - 3 * 60 * 60 * 1000 // 3 hours ago in milliseconds
        );
      });
    });

    it('should return 500 Internal Server Error when fetching news fails', async () => {
      processNewsRequest.mockRejectedValueOnce(new Error('Service Error'));

      const response = await request(app).get('/api/v1/news');

      expect(response.status).toBe(500);
      expect(response.body).toStrictEqual({ error: 'Internal Server Error' });
    });
  });
});
