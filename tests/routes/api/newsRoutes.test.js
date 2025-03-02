import { jest } from '@jest/globals';
import request from 'supertest';
import db from '../../src/config/db.js';
import createServer from '../../src/loaders/server.js';
import { default as newsApiService } from '../../src/services/newsApiService.js';
import { generateMockSavedArticles } from '../mocks/generateMockSavedArticles.js';

const fetchScienceNews = jest.spyOn(newsApiService, 'fetchScienceNews');

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
    it('should return 200 OK and a list of science news articles', async () => {
      const mockedScienceNews = generateMockSavedArticles(6);
      fetchScienceNews.mockResolvedValue(mockedScienceNews);

      const response = await request(app).get(`/api/v1/news`);
      console.log('Response:', response.body);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const article = response.body[0];
      expect(article).toHaveProperty('source.name');
      expect(article).toHaveProperty('title');
      expect(article).toHaveProperty('url');
      expect(article).toHaveProperty('publishedAt');

      expect(fetchScienceNews).toHaveBeenCalledTimes(1);

      expect(fetchScienceNews).toHaveBeenCalledWith();
    });

    it('should return 500 Internal Server Error when the News API fails', async () => {
      fetchScienceNews.mockRejectedValueOnce(new Error('API Error'));

      const response = await request(app).get('/api/v1/news');
      expect(response.status).toBe(500);
      expect(response.body).toStrictEqual({ error: 'Internal Server Error' });
    });
  });
});
