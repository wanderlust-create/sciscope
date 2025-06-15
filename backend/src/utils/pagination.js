/**
 * Applies pagination and sorting to an Objection.js query.
 * @param {object} query - The Objection.js query builder instance.
 * @param {object} options - Pagination and sorting options.
 * @param {number} [options.page=1] - The page number (1-based index).
 * @param {number} [options.limit=10] - The number of records per page.
 * @param {string} [options.sortBy='id'] - The column to sort by.
 * @param {string} [options.order='desc'] - The sorting order ('asc' or 'desc').
 * @returns {Promise<Array>} - The paginated results.
 */
export function applyPagination(
  query,
  { page = 1, limit = 10, sortBy = 'id', order = 'desc' }
) {
  const parsedPage = Number(page);
  const parsedLimit = Number(limit);

  const validPage = parsedPage > 0 ? parsedPage : 1;
  const validLimit = parsedLimit > 0 ? parsedLimit : 10;

  const offset = (validPage - 1) * validLimit;

  return query.limit(validLimit).offset(offset).orderBy(sortBy, order);
}
