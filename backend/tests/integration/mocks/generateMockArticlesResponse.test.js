import { afterAll } from '@jest/globals';
import db from '../../../src/config/db.js';
import { generateMockArticlesResponse } from '../../mocks/generateMockArticles.js';

afterAll(async () => {
  await db.destroy();
});

describe('generateMockArticlesResponse', () => {
  it('should generate the correct structure with the expected number of articles', () => {
    const numArticles = 5;
    const mockResponse = generateMockArticlesResponse(numArticles);

    // ✅ Ensure correct top-level structure
    expect(mockResponse).toHaveProperty('status', 'ok');
    expect(mockResponse).toHaveProperty('totalResults', numArticles);
    expect(mockResponse).toHaveProperty('articles');

    // ✅ Ensure articles is an array with the correct number of elements
    expect(Array.isArray(mockResponse.articles)).toBe(true);
    expect(mockResponse.articles.length).toBe(numArticles);

    // ✅ Verify structure of the first article
    const firstArticle = mockResponse.articles[0];
    expect(firstArticle).toHaveProperty('source');
    expect(firstArticle.source).toHaveProperty('name');

    expect(firstArticle).toHaveProperty('title');
    expect(firstArticle).toHaveProperty('description');
    expect(firstArticle).toHaveProperty('url');
    expect(firstArticle).toHaveProperty('urlToImage');
    expect(firstArticle).toHaveProperty('publishedAt');

    // ✅ Check if publishedAt is a valid date
    expect(new Date(firstArticle.publishedAt).toString()).not.toBe(
      'Invalid Date'
    );
  });

  it('should not nest articles under another articles key', () => {
    const mockResponse = generateMockArticlesResponse(5);

    // ❌ This should NOT exist: mockResponse.articles.articles
    expect(mockResponse.articles).not.toHaveProperty('articles');
  });
});
