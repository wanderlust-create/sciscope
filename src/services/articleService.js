import axios from 'axios';
import dotenv from 'dotenv';
import http from 'http';
import https from 'https';
import db from '../config/db.js';
import logger from '../loaders/logger.js';

dotenv.config();

const NEWS_API_URL = 'https://newsapi.org/v2/top-headlines';
const API_KEY = process.env.NEWS_API_KEY;

const axiosInstance = axios.create({
  timeout: 5000,
  httpAgent: new http.Agent({ keepAlive: false }),
  httpsAgent: new https.Agent({ keepAlive: false }),
});

export async function fetchAndStoreArticles() {
  try {
    logger.info('📰 Fetching latest stored article timestamp...');

    const latestArticle = await db('articles')
      .orderBy('publishedAt', 'desc')
      .first();

    logger.info({
      message: '✅ Latest Article SERVICE Fetched from DB',
      publishedAt: latestArticle,
    });

    // ✅ Ensure latestPublishedAt is declared BEFORE using it
    const latestPublishedAt = latestArticle
      ? new Date(latestArticle.publishedAt)
      : null;

    logger.info({
      message: '✅ Latest Article SERVICE DATE Fetched from DB',
      publishedAt: latestPublishedAt,
    });

    // Step 2: Fetch new articles from the News API
    logger.info('🌍 Fetching new science articles from News API...');
    const response = await axiosInstance.get(NEWS_API_URL, {
      params: {
        category: 'science',
        country: 'us',
        apiKey: API_KEY,
      },
    });

    logger.info({
      message: '✅ Articles fetched from News API',
      count: response.data.articles.length,
    });

    if (!response.data.articles || response.data.articles.length === 0) {
      logger.warn('⚠️ No articles returned from the News API.');
      return;
    }

    // Step 3: Process API response & filter only newer articles
    const newArticles = response.data.articles
      .filter((article) => {
        if (!article.url || !article.publishedAt) return false; // Ensure valid data
        const articlePublishedAt = new Date(article.publishedAt);
        return !latestPublishedAt || articlePublishedAt > latestPublishedAt;
      })
      .map((article) => ({
        title: article.title,
        description: article.description || 'No description available',
        url: article.url,
        url_to_image: article.urlToImage || null,
        published_at: article.publishedAt,
        author_name: article.author || 'Unknown',
        source_name: article.source.name || 'Unknown',
      }));

    if (newArticles.length === 0) {
      logger.info('📭 No new articles to insert.');
      return;
    }

    // Step 4: Insert into DB (skip duplicates using `onConflict`)
    await db('articles')
      .insert(newArticles)
      .onConflict('url') // Avoid duplicate URLs
      .ignore();

    logger.info({
      message: '✅ Successfully stored new articles',
      count: newArticles.length,
    });
  } catch (error) {
    logger.error({
      message: '❌ Error fetching or storing articles',
      error: error.message,
    });
  }
}
