import request from 'supertest';
import db from '../../../../src/config/db.js';
import createServer from '../../../../src/loaders/server.js';
import { storeArticlesInDB } from '../../../../src/services/dbService.js';
import { generateMockArticlesResponse } from '../../../mocks/generateMockArticles.js';
import { flushCache } from '../../../../src/services/cacheService.js';

const app = createServer();
let server;

beforeAll(async () => {
  await db('articles').del();
  server = app.listen(8080);
});

beforeEach(async () => {
  flushCache();
  await db('articles').del();
});

afterAll(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
    console.log('Server closed.');
  }

  await db('articles').del();
  await db.destroy();
});

describe('GET /api/v1/news Pagination', () => {
  it('should return paginated news articles (page 1, limit 5)', async () => {
    const mockRecentArticles = generateMockArticlesResponse(
      15,
      null,
      true,
      false,
      3 // Ensures articles are within the last 3 hours
    );

    await storeArticlesInDB(mockRecentArticles);

    const res = await request(app).get('/api/v1/news?page=1&limit=5');

    expect(res.status).toBe(200);
    expect(res.body.total_count).toBe(15); // Mocked total count
    expect(res.body.total_pages).toBe(3);
    expect(res.body.current_page).toBe(1);
    expect(res.body.articles.length).toBe(5);
  });

  it('should return the second page of news articles', async () => {
    const mockRecentArticles = generateMockArticlesResponse(
      20,
      null,
      true,
      false,
      3
    );

    await storeArticlesInDB(mockRecentArticles);

    const res = await request(app).get('/api/v1/news?page=2&limit=5');

    expect(res.status).toBe(200);
    expect(res.body.current_page).toBe(2);
    expect(res.body.articles.length).toBe(5);
  });

  it('should return an empty array if page exceeds total articles', async () => {
    const mockRecentArticles = generateMockArticlesResponse(
      15,
      null,
      true,
      false,
      3
    );

    await storeArticlesInDB(mockRecentArticles);

    const res = await request(app).get(
      '/api/v1/news?page=999&limit=5&test_no_api=true'
    );

    expect(res.status).toBe(200);
    expect(res.body.articles).toEqual([]);
    expect(res.body.articles.length).toBe(0);
  });

  it('should default to page 1 and limit 10 if no query params are provided', async () => {
    const mockRecentArticles = generateMockArticlesResponse(
      15,
      null,
      true,
      false,
      3
    );

    await storeArticlesInDB(mockRecentArticles);

    const res = await request(app).get('/api/v1/news');

    expect(res.status).toBe(200);
    expect(res.body.current_page).toBe(1);
    expect(res.body.articles.length).toBeLessThanOrEqual(10);
  });

  it('should sort news articles by published_at DESC (latest first)', async () => {
    const now = new Date();
    const mockRecentArticles = generateMockArticlesResponse(
      15,
      null,
      true,
      false,
      3
    );

    await storeArticlesInDB(mockRecentArticles);

    const res = await request(app).get('/api/v1/news?page=1&limit=5');

    expect(res.status).toBe(200);
    const { articles } = res.body;

    expect(articles.length).toBeGreaterThan(1);
    expect(new Date(articles[0].publishedAt)).toBeInstanceOf(Date);
    expect(
      new Date(articles[0].publishedAt) >=
        new Date(articles[articles.length - 1].publishedAt)
    ).toBe(true);

    // Ensure all articles are within the last 3 hours
    articles.forEach((article) => {
      expect(new Date(article.publishedAt).getTime()).toBeGreaterThanOrEqual(
        now - 3 * 60 * 60 * 1000
      );
    });
  });
});
