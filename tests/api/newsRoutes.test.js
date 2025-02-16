import request from 'supertest';
import createServer from '../../src/loaders/server.js';
import NewsService from '../../src/services/newsService.js';
import { jest } from '@jest/globals';

const app = createServer();
let server;

beforeAll(() => {
  server = app.listen(8080);
});

afterAll((done) => {
  server.close(done);
});

const mockNews = [
  {
    source: { name: 'Indiandefencereview.com' },
    author: null,
    title:
      'Scientists Stunned After Finding Organic Molecules in a 66-Million-Year-Old Dinosaur Bone',
    description:
      'For more than a century, paleontologists believed that fossilization erased all traces of organic molecules from dinosaur bones.',
    url: 'https://indiandefencereview.com/organic-molecules-66-M-year-dinosaur-bone/',
    urlToImage:
      'https://indiandefencereview.com/wp-content/uploads/2025/02/Scientists-Stunned.jpg',
    publishedAt: '2025-02-12T21:14:33Z',
  },
];

describe('News Controller', () => {
  describe('GET /api/v1/news', () => {
    it('should return 200 OK and a list of science news articles', async () => {
      jest
        .spyOn(NewsService, 'fetchScienceNews')
        .mockResolvedValueOnce(mockNews);

      const response = await request(app).get(`/api/v1/news`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const article = response.body[0];
      expect(article).toHaveProperty('source');
      expect(article.source).toHaveProperty('name');
      expect(article).toHaveProperty('author');
      expect(article).toHaveProperty('title');
      expect(article).toHaveProperty('description');
      expect(article).toHaveProperty('url');
      expect(article).toHaveProperty('urlToImage');
      expect(article).toHaveProperty('publishedAt');
    });

    it('should return 500 Internal Server Error when the News API fails', async () => {
      jest
        .spyOn(NewsService, 'fetchScienceNews')
        .mockRejectedValueOnce(new Error('API Error'));

      const response = await request(app).get(`/api/v1/news`);
      expect(response.status).toBe(500);
      expect(response.body).toStrictEqual({ error: 'Failed to fetch news' });
    });
  });
});
