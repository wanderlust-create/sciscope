import winston from "winston";
import dotenv from "dotenv";

dotenv.config();

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.json({ space: 4 }),
  transports: [
    new winston.transports.File({ filename: "logs/all.log" }),
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
  ],
});

// Add console logging in non-production environments
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

export default logger;
