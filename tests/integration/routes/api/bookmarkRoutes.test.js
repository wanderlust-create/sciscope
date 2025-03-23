import request from 'supertest';
import knex from '../../../../src/config/db.js';
import createServer from '../../../../src/loaders/server.js';
import Article from '../../../../src/models/Article.js';
import Bookmark from '../../../../src/models/Bookmark.js';
import User from '../../../../src/models/User.js';

const app = createServer();
let server, token, user, article, article2;

beforeAll(async () => {
  server = app.listen(8080);
  await knex.migrate.latest();
  await knex.seed.run();
});

beforeEach(async () => {
  await knex.raw('TRUNCATE TABLE user_bookmarks RESTART IDENTITY CASCADE');

  // Fetch a seeded user and articles
  user = await User.query().whereNotNull('password_hash').first();
  const articles = await Article.query().limit(30); // Fetch 30 articles for pagination tests
  article = articles[0];
  article2 = articles[1];

  // Ensure necessary data exists
  expect(user).toBeDefined();
  expect(article).toBeDefined();
  expect(article2).toBeDefined();

  // Authenticate user
  const loginRes = await request(app).post('/api/v1/auth/login').send({
    email: user.email,
    password: 'Password123!',
  });

  expect(loginRes.status).toBe(200);
  token = `Bearer ${loginRes.body.token}`;

  // Pre-insert bookmarks for pagination
  await Bookmark.query().insert(
    articles.map((a) => ({
      user_id: user.id,
      article_id: a.id,
    }))
  );
});

afterAll(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await knex.destroy();
});

describe('Bookmark API Endpoints', () => {
  it('should create a new bookmark', async () => {
    // Fetch an article that is NOT already bookmarked
    const newArticle = await Article.query()
      .whereNotIn('id', function () {
        this.select('article_id')
          .from('user_bookmarks')
          .where('user_id', user.id);
      })
      .first();
    expect(newArticle).toBeDefined();

    const res = await request(app)
      .post('/api/v1/bookmarks')
      .set('Authorization', token)
      .send({ article_id: newArticle.id });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('user_id', user.id);
    expect(res.body).toHaveProperty('article_id', newArticle.id);
  });

  it('should not allow duplicate bookmarks', async () => {
    const res = await request(app)
      .post('/api/v1/bookmarks')
      .set('Authorization', token)
      .send({ article_id: article.id });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already bookmarked/);
  });

  it('should fetch all user bookmarks', async () => {
    const res = await request(app)
      .get('/api/v1/bookmarks')
      .set('Authorization', token);

    expect(res.status).toBe(200);
    expect(res.body.bookmarks).toBeInstanceOf(Array);
    expect(res.body.total).toBe(30); // Matches pre-inserted bookmarks
  });

  it('should return paginated bookmarks (page 1, limit 5)', async () => {
    const res = await request(app)
      .get('/api/v1/bookmarks?page=1&limit=5')
      .set('Authorization', token);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total', 30);
    expect(res.body.bookmarks.length).toBe(5);
  });

  it('should return the second page of bookmarks', async () => {
    const res = await request(app)
      .get('/api/v1/bookmarks?page=2&limit=5')
      .set('Authorization', token);

    expect(res.status).toBe(200);
    expect(res.body.bookmarks.length).toBe(5);
  });

  it('should return an empty array if page exceeds total bookmarks', async () => {
    const res = await request(app)
      .get('/api/v1/bookmarks?page=999&limit=5')
      .set('Authorization', token);

    expect(res.status).toBe(200);
    expect(res.body.bookmarks).toEqual([]);
    expect(res.body.bookmarks.length).toBe(0);
  });

  it('should default to page 1 and limit 10 if no query params are provided', async () => {
    const res = await request(app)
      .get('/api/v1/bookmarks')
      .set('Authorization', token);

    expect(res.status).toBe(200);
    expect(res.body.bookmarks.length).toBeLessThanOrEqual(10);
  });

  it('should delete a bookmark', async () => {
    const bookmark = await Bookmark.query().first();

    const res = await request(app)
      .delete(`/api/v1/bookmarks/${bookmark.id}`)
      .set('Authorization', token);

    expect(res.status).toBe(204);

    const checkBookmark = await Bookmark.query().findById(bookmark.id);
    expect(checkBookmark).toBeUndefined();
  });

  it('should return 404 if bookmark does not exist', async () => {
    const res = await request(app)
      .delete('/api/v1/bookmarks/999999')
      .set('Authorization', token);

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/);
  });
});
