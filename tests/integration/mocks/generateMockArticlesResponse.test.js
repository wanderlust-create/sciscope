import { generateMockArticlesResponse } from '../../mocks/generateMockArticles.js';

describe('generateMockArticlesResponse', () => {
  it('should generate the correct structure with the expected number of articles', () => {
    const numArticles = 5; // Test with 5 articles
    const mockResponse = generateMockArticlesResponse(numArticles);
    // Ensure the structure is correct
    expect(mockResponse).toHaveProperty('status', 'ok');
    expect(mockResponse).toHaveProperty('totalResults', numArticles);
    expect(mockResponse).toHaveProperty('articles');

    // Ensure `articles` is an array and contains the correct number of articles
    expect(Array.isArray(mockResponse.articles)).toBe(true);
    expect(mockResponse.articles.length).toBe(numArticles);

    // Verify structure of the first article
    const firstArticle = mockResponse.articles[0];
    expect(firstArticle).toHaveProperty('source');
    expect(firstArticle.source).toHaveProperty('name');

    expect(firstArticle).toHaveProperty('title');
    expect(firstArticle).toHaveProperty('description');
    expect(firstArticle).toHaveProperty('url');
    expect(firstArticle).toHaveProperty('urlToImage');
    expect(firstArticle).toHaveProperty('publishedAt');

    // Optional: Check if `publishedAt` is a valid date
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
