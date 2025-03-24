import request from 'supertest';
import knex from '../../../../src/config/db.js';
import createServer from '../../../../src/loaders/server.js';
import User from '../../../../src/models/User.js';
import BookmarkGroup from '../../../../src/models/BookmarkGroup.js';

const app = createServer();
let server, token, user;

beforeAll(async () => {
  server = app.listen(8081);
  await knex.migrate.latest();
  await knex.seed.run();
});

beforeEach(async () => {
  user = await User.query().whereNotNull('password_hash').first();

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
      .send({ group_name: 'New Science Group' });

    expect(res.status).toBe(201);
    expect(res.body.group_name).toBe('New Science Group');
  });

  it('prevents duplicate group names', async () => {
    await BookmarkGroup.query().insert({
      user_id: user.id,
      group_name: 'Duplicate Group',
    });

    const res = await request(app)
      .post('/api/v1/bookmark-groups')
      .set('Authorization', token)
      .send({ group_name: 'Duplicate Group' });

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
      .where({ user_id: user.id })
      .first();

    const res = await request(app)
      .patch(`/api/v1/bookmark-groups/${group.id}`)
      .set('Authorization', token)
      .send({ group_name: 'Updated Name' });

    expect(res.status).toBe(200);
    expect(res.body.group_name).toBe('Updated Name');
  });

  it('deletes a bookmark group', async () => {
    const group = await BookmarkGroup.query().insert({
      user_id: user.id,
      group_name: 'Temp Group',
    });

    const res = await request(app)
      .delete(`/api/v1/bookmark-groups/${group.id}`)
      .set('Authorization', token);

    expect(res.status).toBe(204);
  });
});
