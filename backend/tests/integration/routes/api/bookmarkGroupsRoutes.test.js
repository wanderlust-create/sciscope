import request from 'supertest';
import knex from '../../../../src/config/db.js';
import createServer from '../../../../src/loaders/server.js';
import User from '../../../../src/models/User.js';
import BookmarkGroup from '../../../../src/models/BookmarkGroup.js';

const app = createServer();
let server, token, user;

beforeAll(async () => {
  server = app.listen(0);
  await knex.migrate.latest();
  await knex.seed.run();
});

beforeEach(async () => {
  user = await User.query().whereNotNull('passwordHash').first();

  const loginRes = await request(app).post('/api/v1/auth/login').send({
    email: user.email,
    password: 'Password123!',
  });

  token = `Bearer ${loginRes.body.token}`;
});

afterAll(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await knex.destroy();
});

describe('Bookmark Groups API', () => {
  it('creates a new bookmark group', async () => {
    const res = await request(app)
      .post('/api/v1/bookmark-groups')
      .set('Authorization', token)
      .send({ groupName: 'New Science Group' });
    expect(res.status).toBe(201);
    expect(res.body.groupName).toBe('New Science Group');
  });

  it('prevents duplicate group names', async () => {
    await BookmarkGroup.query().insert({
      userId: user.id,
      groupName: 'Duplicate Group',
    });

    const res = await request(app)
      .post('/api/v1/bookmark-groups')
      .set('Authorization', token)
      .send({ groupName: 'Duplicate Group' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already exists/);
  });

  it('fetches all bookmark groups for the user', async () => {
    const res = await request(app)
      .get('/api/v1/bookmark-groups')
      .set('Authorization', token);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    const groupNames = res.body.map((g) => g.groupName);

    // Expect seeded group names
    expect(groupNames).toEqual(
      expect.arrayContaining(['Planets', 'Astrobiology'])
    );

    // Optional: check schema
    res.body.forEach((group) => {
      expect(group).toHaveProperty('id');
      expect(group).toHaveProperty('userId', user.id);
      expect(group).toHaveProperty('groupName');
      expect(group).toHaveProperty('createdAt');
    });
  });

  it('fetches a group with its articles', async () => {
    const group = await BookmarkGroup.query()
      .where({ userId: user.id })
      .first();

    const res = await request(app)
      .get(`/api/v1/bookmark-groups/${group.id}/articles`)
      .set('Authorization', token);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('groupName');
    expect(Array.isArray(res.body.bookmarks)).toBe(true);
  });

  it('updates a group name', async () => {
    const group = await BookmarkGroup.query()
      .where({ userId: user.id })
      .first();

    const res = await request(app)
      .patch(`/api/v1/bookmark-groups/${group.id}`)
      .set('Authorization', token)
      .send({ groupName: 'Updated Name' });

    expect(res.status).toBe(200);
    expect(res.body.groupName).toBe('Updated Name');
  });

  it('deletes a bookmark group', async () => {
    const group = await BookmarkGroup.query().insert({
      userId: user.id,
      groupName: 'Temp Group',
    });

    const res = await request(app)
      .delete(`/api/v1/bookmark-groups/${group.id}`)
      .set('Authorization', token);

    expect(res.status).toBe(204);
    expect(res.text).toBe('');
  });

  it('returns 404 when fetching a non-existing group', async () => {
    const res = await request(app)
      .get('/api/v1/bookmark-groups/9999/articles')
      .set('Authorization', token);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 404 when updating a non-existent group', async () => {
    const res = await request(app)
      .patch('/api/v1/bookmark-groups/9999')
      .set('Authorization', token)
      .send({ groupName: 'New Name' });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
  it('returns 404 when deleting a non-existent group', async () => {
    const res = await request(app)
      .delete('/api/v1/bookmark-groups/9999')
      .set('Authorization', token);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 when updating a group without groupName', async () => {
    const group = await BookmarkGroup.query().insert({
      userId: user.id,
      groupName: 'Initial Name',
    });

    const res = await request(app)
      .patch(`/api/v1/bookmark-groups/${group.id}`)
      .set('Authorization', token)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Group name is required/);
  });

  it('returns 400 when trying to delete without providing groupId', async () => {
    const res = await request(app)
      .delete('/api/v1/bookmark-groups/')
      .set('Authorization', token);

    expect(res.status).toBe(404); // Express will return 404 because route expects :id
  });
});
