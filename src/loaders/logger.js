import { createLogger, format, transports } from 'winston';

const { combine, timestamp, printf, colorize, errors, json } = format;

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(timestamp(), errors({ stack: true }), json({ space: 2 })),
  transports: [
    new transports.File({ filename: 'logs/all.log' }),
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
  ],
});

// Log to console during development
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        printf(({ timestamp, level, message, stack }) => {
          const baseLog = `${timestamp} ${level}: ${message}`;
          return stack ? `${baseLog}\n${stack}` : baseLog;
        })
      ),
    })
  );
}

export default logger;
