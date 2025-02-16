import db from '../src/config/db.js';

export default async function globalTeardown() {
  console.log('🔻 Closing database connection...');

  await new Promise((resolve) => setTimeout(resolve, 500)); // Small delay before closing
  await db.destroy();
}
