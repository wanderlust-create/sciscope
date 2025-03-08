import { jest } from '@jest/globals';
import axios from 'axios';
import db from '../../../src/config/db.js';

let cancelTokenSource;
let originalApiKey;

beforeAll(() => {
  cancelTokenSource = axios.CancelToken.source();
  originalApiKey = process.env.NEWS_API_KEY;
});

afterAll(async () => {
  console.log('🔻 Running global teardown...');

  // Cancel any pending API requests
  if (cancelTokenSource) {
    cancelTokenSource.cancel('Test cleanup');
    console.log('✅ Canceled pending API requests.');
  }

  // Close the database connection
  if (db && db.destroy) {
    await db.destroy();
    console.log('✅ Database connection closed.');
  }

  // **Ensure Express server is closed**
  if (global.__SERVER__ && typeof global.__SERVER__.close === 'function') {
    await new Promise((resolve) => global.__SERVER__.close(resolve));
    console.log('✅ Server closed.');
  }

  // Jest sometimes fails to fully exit due to lingering async operations or open handles.
  // This small delay ensures all logs print and allows any pending cleanup tasks to complete
  // before forcefully exiting the process. Without it, tests may hang indefinitely.
  // Keeping this as a last resort to ensure a smooth shutdown.
  setTimeout(() => process.exit(0), 1000);
});

beforeEach(() => {
  jest.resetModules();
});

afterEach(() => {
  process.env.NEWS_API_KEY = originalApiKey;
});

describe('SERVICE should fetch real science news from the API', () => {
  it('Real API Call (processNewsRequest)', async () => {
    const { processNewsRequest } = await import(
      '../../../src/services/newsService.js'
    );

    const news = await processNewsRequest();

    expect(Array.isArray(news)).toBe(true);
    expect(news.length).toBeGreaterThan(0);
    expect(news[0]).toHaveProperty('title');
  });

  it('Real API Call (processQueryRequest)', async () => {
    const { processQueryRequest } = await import(
      '../../../src/services/queryService.js'
    );

    const response = await processQueryRequest('nasa');
    const { articles } = response;

    expect(Array.isArray(articles)).toBe(true);
    expect(articles.length).toBeGreaterThan(0);
    expect(articles[0]).toHaveProperty('title');
  });

  it('should handle API failure correctly', async () => {
    process.env.NEWS_API_KEY = 'INVALID_KEY';

    // Re-import the module so the new API key is used
    const { processNewsRequest } = await import(
      '../../../src/services/newsService.js'
    );

    await expect(processNewsRequest()).rejects.toThrow(
      'Invalid API key. Please verify your NEWS_API_KEY.'
    );
  });
});
