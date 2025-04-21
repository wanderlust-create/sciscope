import knex from '../src/config/db.js';
import { faker } from '@faker-js/faker';
import logger from '../src/loaders/logger.js';

const NUM_USERS = 10000;
const NUM_ARTICLES = 5000;
const NUM_BOOKMARKS = 100000;

async function seedDatabase() {
  logger.info('🚀 Seeding database with test data...');

  try {
    // ✅ Ensure Unique Users
    const usernames = new Set();
    const emails = new Set();
    const oauthIds = new Set();
    const users = [];

    while (users.length < NUM_USERS) {
      let username = faker.internet.username();
      let email = faker.internet.email();
      let useOAuth = faker.datatype.boolean(); // 50% chance OAuth
      let oauthId = useOAuth ? faker.string.uuid() : null;

      if (
        !usernames.has(username) &&
        !emails.has(email) &&
        (!oauthId || !oauthIds.has(oauthId))
      ) {
        usernames.add(username);
        emails.add(email);
        if (oauthId) oauthIds.add(oauthId);

        users.push({
          username,
          email,
          password_hash: useOAuth ? null : faker.internet.password(),
          oauth_provider: useOAuth
            ? faker.helpers.arrayElement(['google', 'github'])
            : null,
          oauth_id: oauthId,
        });
      }
    }
    await knex.batchInsert('users', users, 500);
    logger.info(`✅ Inserted ${NUM_USERS} unique users.`);

    // ✅ Ensure Unique Articles
    const urls = new Set();
    const articles = [];

    while (articles.length < NUM_ARTICLES) {
      let url = faker.internet.url();

      if (!urls.has(url)) {
        urls.add(url);
        articles.push({
          title: faker.lorem.sentence(),
          description: faker.lorem.paragraph(),
          url,
          url_to_image: faker.datatype.boolean() ? faker.image.url() : null, // 20% chance of null
          published_at: faker.date.past().toISOString(),
          created_at: faker.date.past().toISOString(),
          updated_at: faker.date.past().toISOString(),
          author_name: faker.datatype.boolean()
            ? faker.person.fullName()
            : 'Unknown', // 20% chance of "Unknown"
          source_name: faker.company.name(),
        });
      }
    }
    await knex.batchInsert('articles', articles, 500);
    logger.info(`✅ Inserted ${NUM_ARTICLES} unique articles.`);

    // ✅ Ensure Unique Bookmarks
    const bookmarkPairs = new Set();
    const bookmarks = [];

    while (bookmarks.length < NUM_BOOKMARKS) {
      let userId = faker.number.int({ min: 1, max: NUM_USERS });
      let articleId = faker.number.int({ min: 1, max: NUM_ARTICLES });
      let pairKey = `${userId}-${articleId}`;

      if (!bookmarkPairs.has(pairKey)) {
        bookmarkPairs.add(pairKey);
        bookmarks.push({
          user_id: userId,
          article_id: articleId,
          bookmarked_at: knex.fn.now(),
        });
      }
    }
    await knex.batchInsert('user_bookmarks', bookmarks, 1000);
    logger.info(`✅ Inserted ${NUM_BOOKMARKS} unique bookmarks.`);

    logger.info('🎉 Database seeding complete!');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the script
seedDatabase();
