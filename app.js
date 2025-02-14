import createServer from "./src/loaders/server.js";
import dotenv from "dotenv";
import db from "./src/loaders/dbSetup.js";
import logger from "./src/loaders/logger.js";

dotenv.config();

const PORT = process.env.PORT || 8080;

const app = createServer();

app.listen(PORT, async () => {
  logger.info(`🚀 SciScope API listening at http://localhost:${PORT}`);

  // ✅ Check database connection
  try {
    await db.raw("SELECT 1"); // Simple query to verify connection
    logger.info("✅ Database is connected");
  } catch (error) {
    logger.error("❌ Database connection failed:", error);
  }
});

export default app;
