/**
 * Extracts and sorts article URLs to allow consistent comparisons.
 * @param {Array} articles - List of articles.
 * @returns {Array} Sorted list of URLs.
 */
export const getSortedUrls = (articles) => {
  return articles.map((article) => article.url).sort();
};
