import db from '../../../src/config/db.js';
import {
  searchArticlesInDB,
  storeArticlesInDB,
} from '../../../src/services/dbService.js';
import { generateMockArticlesResponse } from '../../mocks/generateMockArticles.js';

beforeEach(async () => {
  await db('articles').del();
});

afterEach(async () => {
  await db('articles').del();
});

afterAll(async () => {
  await db.destroy();
});

describe('Article DB Service (Unit Test)', () => {
  it('should store new articles and retrieve them', async () => {
    const mockArticles = generateMockArticlesResponse(3);
    await storeArticlesInDB(mockArticles);

    const storedArticles = await db('articles').select('*');
    expect(storedArticles.length).toBe(3);
  });

  it('should not insert duplicate articles', async () => {
    const mockArticles = generateMockArticlesResponse(2);
    await storeArticlesInDB(mockArticles);
    await storeArticlesInDB(mockArticles);

    const storedArticles = await db('articles').select('*');
    expect(storedArticles.length).toBe(2);
  });

  it('should filter out older articles when inserting new ones', async () => {
    const initialMockResponse = generateMockArticlesResponse(20);
    await storeArticlesInDB(initialMockResponse);

    let storedArticles = await db('articles').select('*');
    storedArticles.sort(
      (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)
    );

    const latestArticle = storedArticles[0] || null;
    const latestPublishedAt = latestArticle
      ? new Date(latestArticle.publishedAt)
      : null;

    // Retain 5 articles already stored & generate 7 new ones
    const retainedArticles = storedArticles.slice(0, 5);
    const newMockResponse = generateMockArticlesResponse(7);

    newMockResponse.articles.forEach((article, index) => {
      article.publishedAt = latestPublishedAt
        ? new Date(
            latestPublishedAt.getTime() + (index + 1) * 1000
          ).toISOString()
        : new Date().toISOString();
    });
    const totalResults =
      retainedArticles.length + newMockResponse.articles.length;
    const articles = [...retainedArticles, ...newMockResponse.articles];
    // Send new mock Api response with old and new articles
    const newMockApi = {
      status: 'ok',
      totalResults: totalResults,
      articles: articles,
    };
    await storeArticlesInDB(newMockApi);

    const finalStoredArticles = await db('articles').select('*');
    expect(finalStoredArticles.length).toBe(27); // 20 initial + 7 new (missing 5 duplicates)

    // Validate stored URLs match expected URLs (ignoring extra fields)
    const sortedFinalStoredUrls = finalStoredArticles
      .map((article) => article.url)
      .sort();

    const sortedExpectedUrls = [
      ...initialMockResponse.articles,
      ...newMockResponse.articles,
    ]
      .map((article) => article.url)
      .sort();

    expect(sortedFinalStoredUrls).toEqual(sortedExpectedUrls);
  });

  it('should search articles in the database', async () => {
    const mockArticles = generateMockArticlesResponse(20);
    await storeArticlesInDB(mockArticles);

    const query = mockArticles.articles[0].title.split(' ')[0]; // Pick a word from title
    const results = await searchArticlesInDB(query);
    expect(Array.isArray(results.articles)).toBe(true);
    expect(results.articles.length).toBeGreaterThan(0);
  });
});
