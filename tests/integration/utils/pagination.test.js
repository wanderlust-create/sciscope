import knex from '../../../src/config/db.js';
import createServer from '../../../src/loaders/server.js';
import Article from '../../../src/models/Article.js';
import { applyPagination } from '../../../src/utils/pagination.js';

const app = createServer();
let server;

beforeAll(async () => {
  server = app.listen(8080);
  await knex.migrate.latest();
  await knex.seed.run();
  console.log('🔺Locale:', process.env.LANG, process.env.LC_ALL);
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

    expect(results.map((r) => r.title)).toEqual(
      [...results.map((r) => r.title)].sort()
    );
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
