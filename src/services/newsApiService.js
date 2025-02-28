import axios from 'axios';
import dotenv from 'dotenv';
import http from 'http';
import https from 'https';
import logger from '../loaders/logger.js';

dotenv.config();

const axiosInstance = axios.create({
  timeout: 5000,
  httpAgent: new http.Agent({ keepAlive: false }),
  httpsAgent: new https.Agent({ keepAlive: false }),
});

const API_KEY = process.env.NEWS_API_KEY;
const BASE_URL = 'https://newsapi.org/v2';

/**
 * Constructs a NewsAPI URL with query parameters.
 * @param {string} endpoint - API endpoint ('top-headlines' or 'everything').
 * @param {Object} params - Query parameters for the request.
 * @returns {string} - Fully formatted API URL.
 */
function getNewsApiUrl(endpoint, params = {}) {
  return `${BASE_URL}/${endpoint}?${new URLSearchParams({
    apiKey: API_KEY,
    ...params,
  }).toString()}`;
}

/**
 * Fetches top science news headlines.
 * @returns {Promise<Object>} - NewsAPI response containing articles.
 */
export async function fetchScienceNews() {
  return fetchArticles(
    getNewsApiUrl('top-headlines', { country: 'us', category: 'science' }),
    'science news'
  );
}

/**
 * Fetches news articles based on a search query.
 * @param {string} query - Search keyword(s).
 * @param {number} [pageSize=10] - Number of results to fetch.
 * @returns {Promise<Object>} - NewsAPI response containing articles.
 */
export async function searchNewsByQuery(query, pageSize = 10) {
  if (!query) {
    throw new Error('Query parameter is required for searching news.');
  }

  return fetchArticles(
    getNewsApiUrl('everything', {
      q: encodeURIComponent(query),
      language: 'en',
      pageSize,
    }),
    `search query: "${query}" with pageSize: ${pageSize}`
  );
}

/**
 * Executes an API request and handles response validation.
 * @param {string} url - API request URL.
 * @param {string} context - Description of the request for logging.
 * @returns {Promise<Object>} - Parsed response from NewsAPI.
 */
export async function fetchArticles(url, context) {
  try {
    logger.info(`Fetching ${context} from News API...`);
    const response = await axiosInstance.get(url, {
      validateStatus: () => true,
    });

    if (response.status === 401) {
      logger.error(
        '❌ Invalid API key. Check your NEWS_API_KEY in the .env file.'
      );
      throw new Error('Invalid API key. Please verify your NEWS_API_KEY.');
    }

    if (response.status !== 200) {
      logger.error(
        `❌ API Error (${context}): ${response.status} - ${response.statusText}`
      );
      throw new Error(
        `Failed to fetch ${context}. API responded with ${response.status}`
      );
    }

    const articles = response.data.articles || [];
    if (!articles.length) {
      logger.warn(`⚠️ No articles returned from News API for ${context}.`);
    }

    return response.data;
  } catch (error) {
    logger.error(`❌ Error fetching ${context}: ${error.message}`);
    throw new Error(`Failed to fetch ${context}`);
  }
}

export default { fetchScienceNews, searchNewsByQuery, fetchArticles };
