import axios from 'axios';
import dotenv from 'dotenv';
import db from '../config/db.js';
import logger from '../loaders/logger.js';

dotenv.config();

const NEWS_API_URL = 'https://newsapi.org/v2/top-headlines';
const API_KEY = process.env.NEWS_API_KEY;

export async function fetchAndStoreArticles() {
  try {
    // ✅ Fetch the most recent stored article
    const latestArticle = await db('articles')
      .orderBy('publishedAt', 'desc')
      .first();

    const latestPublishedAt = latestArticle
      ? new Date(latestArticle.publishedAt)
      : null;

    // ✅ Fetch new articles from News API
    const response = await axios.get(NEWS_API_URL, {
      params: { category: 'science', country: 'us', apiKey: API_KEY },
    });

    if (!response.data.articles?.length) {
      logger.warn('⚠️ No articles returned from News API.');
      return;
    }

    // ✅ Filter only new articles
    const newArticles = response.data.articles
      .filter(
        (article) =>
          article.url &&
          article.publishedAt &&
          (!latestPublishedAt ||
            new Date(article.publishedAt) > latestPublishedAt)
      )
      .map((article) => ({
        title: article.title,
        description: article.description || 'No description available',
        url: article.url,
        url_to_image: article.urlToImage || null,
        published_at: article.publishedAt,
        author_name: article.author || 'Unknown',
        source_name: article.source.name || 'Unknown',
      }));

    if (!newArticles.length) {
      logger.info('📭 No new articles to insert.');
      return;
    }

    // ✅ Insert into DB (avoid duplicates)
    await db('articles').insert(newArticles).onConflict('url').ignore();

    logger.info(`✅ Stored ${newArticles.length} new articles.`);
  } catch (error) {
    logger.error(`❌ Error fetching/storing articles: ${error.message}`);
  }
}
