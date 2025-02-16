import NewsService from '../services/newsService.js';

const getNews = async (req, res) => {
  try {
    const news = await NewsService.fetchScienceNews();
    res.status(200).json(news);
  } catch {
    res.status(500).json({ error: 'Failed to fetch news' });
  }
};

export default { getNews };
