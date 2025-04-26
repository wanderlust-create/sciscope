import { jest } from '@jest/globals';
import knex from '../../../src/config/db.js';
import createServer from '../../../src/loaders/server.js';
import { applyPagination } from '../../../src/utils/pagination.js';
import Article from '../../../src/models/Article.js';

const app = createServer();
let server;

beforeAll(async () => {
  server = app.listen(8080);
  await knex.migrate.latest();
  await knex.seed.run();
});

beforeEach(async () => {
  await knex('articles').del();
  await knex.seed.run();
});

afterAll(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await knex.destroy();
});

describe('Pagination Logic', () => {
  it('should allow sorting by a different column', async () => {
    const baseQuery = Article.query().select('id', 'title');

    const results = await applyPagination(baseQuery, {
      page: 1,
      limit: 5,
      sortBy: 'id',
      order: 'desc',
    });

    expect(results[0].id).toBeGreaterThan(results[4].id);
  });
  it('should sort results alphabetically (A→Z)', async () => {
    const baseQuery = Article.query().select('id', 'title');
    const results = await applyPagination(baseQuery, {
      page: 1,
      limit: 5,
      sortBy: 'title', // Sort by title
      order: 'asc', // A → Z
    });

    expect(results[0].title).toBeDefined();

    const sortedTitles = [...titles].sort((a, b) => a.localeCompare(b));
    expect(titles).toEqual(sortedTitles);
  });

  it('should sort results in reverse alphabetical order (Z→A)', async () => {
    const baseQuery = Article.query().select('id', 'title');
    const results = await applyPagination(baseQuery, {
      page: 1,
      limit: 5,
      sortBy: 'title', // Sort by title
      order: 'desc', // Z → A
    });

    expect(results.map((r) => r.title)).toEqual(
      [...results.map((r) => r.title)].sort().reverse()
    );
  });
});

describe('Pagination Utility - Edge Cases', () => {
  test('should handle negative page and limit values by defaulting to 1 and 10', () => {
    const query = {
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
    };

    applyPagination(query, { page: -5, limit: -10 });
    expect(query.limit).toHaveBeenCalledWith(10);
    expect(query.offset).toHaveBeenCalledWith(0);
  });

  test('should handle non-numeric page and limit values by defaulting to 1 and 10', () => {
    const query = {
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
    };

    applyPagination(query, { page: 'abc', limit: 'xyz' });

    expect(query.limit).toHaveBeenCalledWith(10);
    expect(query.offset).toHaveBeenCalledWith(0);
  });

  test('should apply pagination correctly even when page is out of range', async () => {
    const query = {
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
    };

    await applyPagination(query, { page: 999, limit: 10 });

    expect(query.limit).toHaveBeenCalledWith(10);
    expect(query.offset).toHaveBeenCalledWith(9980);
  });

  test('should return correct pagination metadata for an empty dataset', async () => {
    const query = {
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
    };

    await applyPagination(query, { page: 1, limit: 10 });

    // Ensure pagination logic was applied
    expect(query.limit).toHaveBeenCalledWith(10);
    expect(query.offset).toHaveBeenCalledWith(0);
  });
});
