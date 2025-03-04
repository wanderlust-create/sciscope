import request from 'supertest';
import db from '../../../src/config/db.js';
import createServer from '../../../src/loaders/server.js';
import { storeArticlesInDB } from '../../../src/services/dbService.js';
import { generateMockArticlesResponse } from '../../mocks/generateMockArticles.js';

const app = createServer();
let server;

beforeAll(() => {
  server = app.listen(3030);
});

beforeEach(async () => {
  await db('articles').del();
});

afterAll(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
    console.log('✅ Server closed.');
  }

  await db('articles').del();
  await db.destroy();
});

describe('GET /api/v1/articles/:id', () => {
  it('should return a single article when it exists', async () => {
    const mockArticles = generateMockArticlesResponse(1);
    await storeArticlesInDB(mockArticles);
    const article = await db('articles').select('*').first();

    const res = await request(app).get(`/api/v1/articles/${article.id}`);

    expect(res.body).toHaveProperty('id', article.id);
    expect(res.body).toHaveProperty('title', mockArticles.articles[0].title);
    expect(res.body).toHaveProperty(
      'description',
      mockArticles.articles[0].description
    );
    expect(res.body).toHaveProperty('description');
    expect(res.body).toHaveProperty('url');
    expect(res.body).toHaveProperty('urlToImage');
    expect(res.body).toHaveProperty('publishedAt');
    expect(res.body).toHaveProperty('authorName');
    expect(res.body).toHaveProperty('sourceName');
  });

  it('should return 404 if the article does not exist', async () => {
    // Act: Request non-existent article
    const res = await request(app).get('/api/v1/articles/999999');

    // Assert: Correct 404 response
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Article not found.' });
  });
});
