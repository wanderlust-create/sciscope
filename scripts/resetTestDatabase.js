import knex from '../src/config/db.js';

async function resetTestDatabase() {
  console.log('🚀 Resetting test database...');

  try {
    // Delete all data while keeping the schema intact
    await knex.raw(
      'TRUNCATE TABLE user_bookmarks, articles, users RESTART IDENTITY CASCADE;'
    );

    console.log('✅ Test database reset complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting test database:', error);
    process.exit(1);
  }
}
resetTestDatabase();
