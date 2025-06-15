import { Model } from 'objection';
import knex from '../../../src/config/db.js';
import Article from '../../../src/models/Article.js';

Model.knex(knex);

beforeEach(async () => {
  await knex('articles').del();
});

afterAll(async () => {
  await knex.destroy();
});

describe('Article Model', () => {
  it('should create an article', async () => {
    const article = await Article.query().insert({
      title: 'Exploring Europa',
      url: 'https://nasa.gov/europa',
      publishedAt: new Date().toISOString(),
      sourceName: 'NASA',
    });

    const storedArticle = await Article.query().findById(article.id);
    expect(storedArticle).not.toBeNull();
    expect(storedArticle.title).toBe('Exploring Europa');
    expect(storedArticle.url).toBe('https://nasa.gov/europa');
    expect(storedArticle.sourceName).toBe('NASA');
  });

  it('should update an article title', async () => {
    const article = await Article.query().insert({
      title: 'Old Title',
      url: 'https://example.com',
      publishedAt: new Date().toISOString(),
      sourceName: 'Example News',
    });

    await article.$query().patch({ title: 'New Title' });

    const updatedArticle = await Article.query().findById(article.id);
    expect(updatedArticle.title).toBe('New Title');
  });

  it('should delete an article', async () => {
    const article = await Article.query().insert({
      title: 'Delete Me',
      url: 'https://example.com/delete',
      publishedAt: new Date().toISOString(),
      sourceName: 'Example News',
    });

    await article.$query().delete();

    const storedArticle = await Article.query().findById(article.id);
    expect(storedArticle).toBeUndefined();
  });
});
