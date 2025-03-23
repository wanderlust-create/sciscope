import logger from '../loaders/logger.js';
import analyticsService from '../services/analyticsService.js';

async function handleAnalyticsRequest(serviceMethod, label, req, res) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const results = await serviceMethod(page, limit);

    res.status(200).json({ results, page, limit });
  } catch (error) {
    logger.error(`❌ Error fetching ${label}: ${error.message}`, {
      stack: error.stack,
    });
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function mostBookmarkedArticles(req, res) {
  return handleAnalyticsRequest(
    analyticsService.getMostBookmarkedArticles,
    'Most Bookmarked Articles',
    req,
    res
  );
}

export async function topBookmarkingUsers(req, res) {
  return handleAnalyticsRequest(
    analyticsService.getTopBookmarkingUsers,
    'Top Bookmarking Users',
    req,
    res
  );
}

export default { mostBookmarkedArticles, topBookmarkingUsers };
