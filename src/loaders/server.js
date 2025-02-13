import express from "express";
import morgan from "morgan";
import apiRoutes from "../routes/index.js";
import apiErrorHandler from "../middleware/apiErrorHandler.js";
import dotenv from "dotenv";

dotenv.config();

function createServer() {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(morgan("combined"));

  // Routes
  app.use("/api/v1", apiRoutes);

  // Error Handling Middleware
  app.use(apiErrorHandler);

  return app;
}

export default createServer;
