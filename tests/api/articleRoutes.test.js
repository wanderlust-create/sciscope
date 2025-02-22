import { faker } from '@faker-js/faker';
import request from 'supertest';
import db from '../../src/config/db.js';
import createServer from '../../src/loaders/server.js';

const app = createServer();
let server;

beforeAll(() => {
  server = app.listen(3232);
});

beforeEach(async () => {
  await db('articles').del();

  await db('articles').insert([
    {
      title: 'Mars Rover Discovers New Rock Formations',
      description: faker.lorem.sentence(), // Randomized
      content: faker.lorem.paragraph(),
      url: 'https://example.com/mars-rover', // Fixed
      url_to_image: 'faker.image.url()',
      published_at: new Date('2025-02-15T12:00:00Z'),
      author_name: faker.person.fullName(), // Randomized
      source_name: faker.company.name(), // Randomized
    },
    {
      title: 'Moon Mission Updates', // Fixed key field
      description: faker.lorem.sentence(),
      content: faker.lorem.paragraph(),
      url: 'https://example.com/moon-mission',
      url_to_image: faker.image.url(),
      published_at: new Date('2025-02-16T12:00:00Z'),
      author_name: faker.person.fullName(),
      source_name: faker.company.name(),
    },
  ]);
});

afterEach(async () => {
  await db('articles').del();
});

afterAll(async () => {
  // ✅ Close the server before Jest exits
  if (server) {
    await new Promise((resolve) => server.close(resolve));
    console.log('✅ Server closed.');
  }

  // ✅ Clean up DB
  await db('articles').del();
  await db.destroy();
});

describe('GET /api/v1/articles/search', () => {
  it('should return articles that match the search query (case-insensitive)', async () => {
    const response = await request(app).get(
      '/api/v1/articles/search?query=mars'
    );

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);

    response.body.forEach((article) => {
      expect(
        article.title.toLowerCase().includes('mars') ||
          article.description.toLowerCase().includes('mars') ||
          article.content.toLowerCase().includes('mars')
      ).toBe(true);
    });
  });

  it('should return an empty array if no articles match the query', async () => {
    const response = await request(app).get(
      '/api/v1/articles/search?query=pluto'
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]); // No articles should match "pluto"
  });

  it('should return only necessary fields', async () => {
    const response = await request(app).get(
      '/api/v1/articles/search?query=mars'
    );

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);

    response.body.forEach((article) => {
      expect(article).toHaveProperty('source_name');
      expect(article).toHaveProperty('author_name');
      expect(article).toHaveProperty('title');
      expect(article).toHaveProperty('description');
      expect(article).toHaveProperty('url');
      expect(article).toHaveProperty('url_to_image');
      expect(article).toHaveProperty('published_at');

      // Ensure no unnecessary fields are present
      expect(article).not.toHaveProperty('content'); // Assuming content is omitted in search results
    });
  });

  it('should support pagination with limit and page', async () => {
    const response = await request(app).get(
      '/api/v1/articles/search?query=mars&limit=1&page=1'
    );

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1); // Should return only one result if pagination is working
  });

  it('should return 400 Bad Request if query param is missing', async () => {
    const response = await request(app).get('/api/v1/articles/search');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('should handle special characters in search query', async () => {
    const response = await request(app).get(
      '/api/v1/articles/search?query=m@rs!'
    );

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0); // Should still return results
  });
});
