/**
 * Applies pagination and sorting to an Objection.js query.
 * @param {object} query - The Objection.js query builder instance.
 * @param {object} options - Pagination and sorting options.
 * @param {number} [options.page=1] - The page number (1-based index).
 * @param {number} [options.limit=10] - The number of records per page.
 * @param {string} [options.sortBy='id'] - The column to sort by.
 * @param {string} [options.order='desc'] - The sorting order ('asc' or 'desc').
 */
export function applyPagination(
  query,
  { page = 1, limit = 10, sortBy = 'id', order = 'desc' }
) {
  // Ensure page and limit are positive integers
  const validPage = Math.max(1, parseInt(page, 10) || 1);
  const validLimit = Math.max(1, parseInt(limit, 10) || 10);

  // Calculate offset for pagination
  const offset = (validPage - 1) * validLimit;

  query.limit(validLimit).offset(offset).orderBy(sortBy, order);
}
