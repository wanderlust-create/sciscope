export async function seed(knex) {
  await knex('user_bookmarks').del();

  const users = await knex('users').select('*');
  const articles = await knex('articles').select('*');

  if (users.length === 0 || articles.length === 0) {
    console.warn('⚠️ Skipping bookmark seed: No users or articles found.');
    return;
  }

  const bookmarks = [];
  for (const user of users) {
    const randomArticles = articles.sort(() => 0.5 - Math.random()).slice(0, 3); // Each user bookmarks 3 articles
    for (const article of randomArticles) {
      bookmarks.push({
        user_id: user.id,
        article_id: article.id,
        bookmarked_at: knex.fn.now(),
      });
    }
  }
  await knex('user_bookmarks').insert(bookmarks);
}
