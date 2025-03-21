import knex from '../config/db.js';

export async function getMostBookmarkedArticles(limit = 5) {
  return knex
    .raw(
      `SELECT a.id, a.title, a.source_name, COUNT(ub.id) AS bookmark_count
     FROM articles a
     LEFT JOIN user_bookmarks ub ON a.id = ub.article_id
     GROUP BY a.id, a.title, a.source_name
     ORDER BY bookmark_count DESC
     LIMIT ?`,
      [limit]
    )
    .then((result) => result.rows);
}

export async function getMostActiveUsers(limit = 5) {
  return knex
    .raw(
      `SELECT u.id, u.username, u.email, COUNT(ub.id) AS bookmark_count
     FROM users u
     LEFT JOIN user_bookmarks ub ON u.id = ub.user_id
     GROUP BY u.id, u.username, u.email
     ORDER BY bookmark_count DESC
     LIMIT ?`,
      [limit]
    )
    .then((result) => result.rows);
}

export default {
  getMostBookmarkedArticles,
  getMostActiveUsers,
};
