import db from '../src/config/db.js';

export default async function globalTeardown() {
  console.log('🔻 Closing database connection...');
  await db.destroy();
}
