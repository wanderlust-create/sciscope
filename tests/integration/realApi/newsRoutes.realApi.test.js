import { jest } from '@jest/globals';
import axios from 'axios';
import supertest from 'supertest';
import app from '../../../app';
import db from '../../../src/config/db.js';

let cancelTokenSource;

beforeAll(() => {
  cancelTokenSource = axios.CancelToken.source();
  jest.setTimeout(10000); // Allow up to 10s for API responses
});

afterAll(async () => {
  console.log('🔻 Running global teardown...');

  if (cancelTokenSource) {
    cancelTokenSource.cancel('Test cleanup');
    console.log('✅ Canceled pending API requests.');
  }

  if (db && db.destroy) {
    await db.destroy();
    console.log('✅ Database connection closed.');
  }

  // **Ensure Express server is closed**
  if (global.__SERVER__ && typeof global.__SERVER__.close === 'function') {
    await new Promise((resolve) => global.__SERVER__.close(resolve));
    console.log('✅ Server closed.');
  }
});

describe('Real API Tests', () => {
  test('Fetches real science news (GET /api/v1/news)', async () => {
    const response = await supertest(app).get('/api/v1/news').expect(200);

    expect(response.body.articles).toBeInstanceOf(Array);
    expect(response.body.articles.length).toBeGreaterThan(0);
    expect(response.body.articles[0]).toHaveProperty('title');
    expect(response.body.articles[0]).toHaveProperty('description');
    expect(response.body.articles[0]).toHaveProperty('url');
    expect(response.body.articles[0]).toHaveProperty('publishedAt');
  });

  test('Fetches news by query (GET /api/v1/search)', async () => {
    const response = await supertest(app)
      .get('/api/v1/search')
      .query({ keyword: 'space' })
      .expect(200);
    expect(response.body.articles).toBeInstanceOf(Array);
    expect(response.body.articles.length).toBeGreaterThan(0);
    expect(typeof response.body).toBe('object');
    expect(response.body.articles[0]).toHaveProperty('title');
    expect(response.body.articles[0]).toHaveProperty('description');
    expect(response.body.articles[0]).toHaveProperty('url');
    expect(response.body.articles[0]).toHaveProperty('publishedAt');
  });

  test('Fails when no query is provided (GET /api/v1/search)', async () => {
    const response = await supertest(app)
      .get('/api/v1/search') // No query provided
      .expect(400); // Expect a 400 Bad Request

    expect(response.body).toHaveProperty(
      'error',
      'Keyword parameter is required.'
    );
  });
});
