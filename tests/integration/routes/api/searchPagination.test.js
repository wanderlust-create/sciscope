import request from 'supertest';
import knex from '../../../../src/config/db.js';
import createServer from '../../../../src/loaders/server.js';

const app = createServer();
let server;

beforeAll(async () => {
  server = app.listen(8080);
  await knex.migrate.latest();
  await knex.seed.run();
});

beforeEach(async () => {
  // await knex.migrate.latest();
  // await knex.seed.run();
});

afterAll(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await knex.destroy();
});

describe('GET /api/v1/search?keyword Pagination', () => {
  it('should return paginated articles (page 1, limit 5)', async () => {
    const res = await request(app).get(
      '/api/v1/search?keyword=jupiter&page=1&limit=5'
    );

    expect(res.status).toBe(200);
    expect(res.body.total_count).toBeGreaterThanOrEqual(5); // Ensure enough articles exist
    expect(res.body).toHaveProperty('total_pages');
    expect(res.body).toHaveProperty('current_page', 1);
    expect(res.body.articles.length).toBe(5);
  });

  it('should return the second page of articles', async () => {
    const res = await request(app).get(
      '/api/v1/search?keyword=exoplanet&page=2&limit=5'
    );

    expect(res.status).toBe(200);
    expect(res.body.current_page).toBe(2);
    expect(res.body.articles.length).toBe(5);
  });

  it('should return an empty array if page exceeds total articles', async () => {
    const res = await request(app).get(
      '/api/v1/search?keyword=saturn&page=999&limit=5'
    );

    expect(res.status).toBe(200);
    expect(res.body.articles).toEqual([]);
    expect(res.body.articles.length).toBe(0);
  });

  it('should default to page 1 and limit 10 if no query params are provided', async () => {
    const res = await request(app).get('/api/v1/search?keyword=venus');

    expect(res.status).toBe(200);
    expect(res.body.current_page).toBe(1);
    expect(res.body.articles.length).toBeLessThanOrEqual(10);
  });

  it('should sort articles by published_at DESC (latest first)', async () => {
    const res = await request(app).get(
      '/api/v1/search?keyword=jupiter&page=1&limit=5'
    );

    expect(res.status).toBe(200);
    const { articles } = res.body;

    expect(articles.length).toBeGreaterThan(1);
    expect(new Date(articles[0].publishedAt)).toBeInstanceOf(Date);
    expect(
      new Date(articles[0].publishedAt) >=
        new Date(articles[articles.length - 1].publishedAt)
    ).toBe(true);
  });
});
