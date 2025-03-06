import request from 'supertest';
import knex from '../../../../src/config/db.js';
import createServer from '../../../../src/loaders/server.js';
import Article from '../../../../src/models/Article.js';
import Bookmark from '../../../../src/models/Bookmark.js';
import User from '../../../../src/models/User.js';

const app = createServer();
let server, token, user, article, article2;

beforeAll(async () => {
  server = app.listen(3031);
  await knex.migrate.latest();
  await knex.seed.run();
});

beforeEach(async () => {
  await knex.raw('TRUNCATE TABLE user_bookmarks RESTART IDENTITY CASCADE');

  // Fetch a seeded user and articles
  user = await User.query().whereNotNull('password_hash').first();
  article = await Article.query().first();
  article2 = await Article.query()
    .whereNot('id', article.id) // Avoid selecting the same article
    .orderBy('id')
    .first();

  // ✅ Ensure user exists
  expect(user).toBeDefined();
  expect(article).toBeDefined();

  // ✅ Get an actual token by signing in the seeded user
  const loginRes = await request(app).post('/api/v1/auth/login').send({
    email: user.email,
    password: 'Password123!', // This should match the seed data
  });

  expect(loginRes.status).toBe(200);
  expect(loginRes.body).toHaveProperty('token');

  token = `Bearer ${loginRes.body.token}`; // Use real JWT
});

afterAll(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await knex.destroy();
});

describe('Bookmark API Endpoints', () => {
  it('should create a new bookmark', async () => {
    const res = await request(app)
      .post('/api/v1/bookmarks')
      .set('Authorization', token)
      .send({ article_id: article.id });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('user_id', user.id);
    expect(res.body).toHaveProperty('article_id', article.id);
  });

  it('should not allow duplicate bookmarks', async () => {
    await Bookmark.query().insert({
      user_id: user.id,
      article_id: article.id,
    });

    const res = await request(app)
      .post('/api/v1/bookmarks')
      .set('Authorization', token)
      .send({ article_id: article.id });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already bookmarked/);
  });

  it('should fetch all user bookmarks', async () => {
    await Bookmark.query().insert([
      { user_id: user.id, article_id: article.id },
      { user_id: user.id, article_id: article2.id },
    ]);

    const res = await request(app)
      .get('/api/v1/bookmarks')
      .set('Authorization', token);

    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toBe(2);
  });

  it('should delete a bookmark', async () => {
    const bookmark = await Bookmark.query().insert({
      user_id: user.id,
      article_id: article.id,
    });
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
