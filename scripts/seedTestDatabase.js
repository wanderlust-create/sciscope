import knex from '../src/config/db.js';
import bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';
import logger from '../src/loaders/logger.js';

const env = process.env.NODE_ENV;

// 🔵 Default to small DBnpm test
const isLargeSeed = env === 'largeDB';

if (isLargeSeed) {
  logger.info(
    '📈 Running LARGE seed mode (full dataset for analytics stress testing).'
  );
} else {
  logger.info(
    '🔹 Running SMALL seed mode (default for Postman, tests, and dev).'
  );
}

const NUM_USERS = isLargeSeed ? 500 : 10;
const NUM_ARTICLES = isLargeSeed ? 2000 : 20;
const NUM_BOOKMARKS = isLargeSeed ? 4000 : 100;

export default async function seedDatabase() {
  logger.info('🚀 Seeding database with test data...');

  try {
    // ✅ Unique Users
    const usernames = new Set();
    const emails = new Set();
    const oauthIds = new Set();
    const users = [];

    // Add known password-based user
    users.push({
      username: 'testuser',
      email: 'testuser@example.com',
      password_hash: await bcrypt.hash('Password123!', 10),
      oauth_provider: null,
      oauth_id: null,
    });

    // Add known OAuth user
    users.push({
      username: 'oauthuser',
      email: 'oauthuser@example.com',
      password_hash: null,
      oauth_provider: 'google',
      oauth_id: 'test-oauth-id',
    });

    logger.info(`🔐 Test login available: testuser@example.com / Password123!`);

    while (users.length < NUM_USERS) {
      // console.log(`Generated ${users.length} USERS...`);
      let username = faker.internet.username();
      let email = faker.internet.email();
      let useOAuth = faker.datatype.boolean();
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
          password_hash: useOAuth
            ? null
            : await bcrypt.hash(faker.internet.password(), 10),
          oauth_provider: useOAuth
            ? faker.helpers.arrayElement(['google', 'github'])
            : null,
          oauth_id: oauthId,
        });
      }
    }

    await knex.batchInsert('users', users, 500);
    logger.info(
      `✅       Inserted ${users.length} users: Including 1 known password and 1 OAuth user.`
    );
    // ✅ Unique Articles
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
          url_to_image: faker.datatype.boolean() ? faker.image.url() : null,
          published_at: faker.date.past().toISOString(),
          created_at: faker.date.past().toISOString(),
          updated_at: faker.date.past().toISOString(),
          author_name: faker.datatype.boolean()
            ? faker.person.fullName()
            : 'Unknown',
          source_name: faker.company.name(),
        });
      }
    }

    await knex.batchInsert('articles', articles, 500);
    logger.info(`✅       Inserted ${NUM_ARTICLES} unique articles.`);

    // ✅ Add bookmarks and groups for testuser
    const testUser = await knex('users')
      .where({ email: 'testuser@example.com' })
      .first();
    const testArticleIds = (await knex('articles').select('id').limit(10)).map(
      (a) => a.id
    );

    const testBookmarks = testArticleIds.slice(0, 5).map((articleId) => ({
      user_id: testUser.id,
      article_id: articleId,
      bookmarked_at: knex.fn.now(),
    }));

    const insertedBookmarks = await knex('user_bookmarks')
      .insert(testBookmarks)
      .returning('*');
    logger.info(`✅       Inserted 5 bookmarks for known test user.`);
    const groups = [
      {
        user_id: testUser.id,
        group_name: 'Planets',
        created_at: knex.fn.now(),
      },
      {
        user_id: testUser.id,
        group_name: 'Astrobiology',
        created_at: knex.fn.now(),
      },
    ];

    const groupResults = await knex('bookmark_groups')
      .insert(groups)
      .returning('*');

    const assignments = insertedBookmarks.map((bookmark, idx) => ({
      user_bookmark_id: bookmark.id,
      bookmark_group_id: groupResults[idx % groupResults.length].id,
      assigned_at: knex.fn.now(),
    }));

    await knex('bookmark_group_assignments').insert(assignments);
    logger.info(
      '✅       Created 2 bookmark groups and inserted 5 articles randomly into the 2 groups.'
    );

    // ✅ Random bookmarks for other users
    const bookmarkPairs = new Set();
    const bookmarks = [];

    while (bookmarks.length < NUM_BOOKMARKS) {
      let userId = faker.number.int({ min: 1, max: NUM_USERS });
      if (userId === testUser.id) continue;

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
    logger.info(`✅       Inserted ${NUM_BOOKMARKS} random bookmarks.`);

    logger.info('🎉 Database seeding complete!');
  } catch (error) {
    logger.error('❌ Error seeding database:', error);
    throw error;
  }
}
