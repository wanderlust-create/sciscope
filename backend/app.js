import dotenv from 'dotenv';
dotenv.config();

import createServer from './src/loaders/server.js';
import db from './src/config/db.js';
import logger from './src/loaders/logger.js';

const PORT = process.env.PORT || 8080;
const app = createServer();

app.listen(PORT, async () => {
  logger.info(`🚀 SciScope API listening at http://localhost:${PORT}`);

  // ✅ Check database connection
  try {
    await db.raw('SELECT 1'); // Simple query to verify connection
    logger.info('✅ Database is connected');
    const dbName = db.context?.client?.config?.connection?.database;
    logger.info(`🔍 Connected to database: ${dbName}`);
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
  }
});

export default app;
