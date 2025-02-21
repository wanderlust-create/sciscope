import { jest } from '@jest/globals';
import axios from 'axios';
import db from '../../src/config/db.js';
import { fetchAndStoreArticles } from '../../src/services/articleService.js';
import { generateMockArticlesResponse } from '../mocks/generateMockArticles.js';

axios.get = jest.fn();

describe('Article Service (Unit Test)', () => {
  beforeEach(async () => {
    await db('articles').del();
  });

  afterEach(async () => {
    await db('articles').del();
  });

  afterAll(async () => {
    await db.destroy();
  });

  it('should fetch and store new articles', async () => {
    const mockArticleResponse = generateMockArticlesResponse(1);
    axios.get.mockResolvedValueOnce({ data: mockArticleResponse });

    await fetchAndStoreArticles();

    const storedArticles = await db('articles').select('*');
    const mockArticle = mockArticleResponse.articles[0];

    expect(storedArticles.length).toBe(1);
    expect(storedArticles[0]).toMatchObject({
      title: mockArticle.title,
      description: mockArticle.description,
      url: mockArticle.url,
      urlToImage: mockArticle.urlToImage,
      publishedAt: new Date(mockArticle.publishedAt),
      authorName: mockArticle.author || 'Unknown',
      sourceName: mockArticle.source.name || 'Unknown',
    });
  });

  it('should NOT insert duplicate articles', async () => {
    const mockArticles = generateMockArticlesResponse(1);
    axios.get.mockResolvedValueOnce({ data: mockArticles });

    await fetchAndStoreArticles(); // First insert
    await fetchAndStoreArticles(); // Second insert with same data

    const storedArticles = await db('articles').select('*');
    expect(storedArticles.length).toBe(1); // No duplicates
  });

  it('should only insert newer articles', async () => {
    // ✅ Insert an older article manually
    const oldArticle = generateMockArticlesResponse(1).articles[0];

    oldArticle.publishedAt = new Date('2025-02-15T12:00:00Z').toISOString();

    await db('articles').insert({
      title: oldArticle.title,
      description: oldArticle.description,
      url: oldArticle.url,
      urlToImage: oldArticle.urlToImage,
      publishedAt: oldArticle.publishedAt,
      authorName: oldArticle.author || 'Unknown',
      sourceName: oldArticle.source.name || 'Unknown',
    });

    // ✅ Generate and fetch an older article
    const newArticle = generateMockArticlesResponse(1).articles[0];
    console.log(JSON.stringify(newArticle, null, 2));

    newArticle.publishedAt = new Date('2025-01-17T12:00:00Z').toISOString();
    console.log(JSON.stringify(newArticle, null, 2));

    axios.get.mockResolvedValueOnce({ data: newArticle });

    await fetchAndStoreArticles();

    const storedArticles = await db('articles').orderBy('publishedAt', 'desc');

    expect(storedArticles.length).toBe(1); // older article did not get saved
    expect(storedArticles).not.toEqual(
      expect.arrayContaining([expect.objectContaining(newArticle)])
    );
  });
});
