import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import logger from '../loaders/logger.js';

dotenv.config();

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  logger.info('Received auth request', { token });

  try {
    // Check if the token is blacklisted
    const blacklisted = await db('blacklisted_tokens').where({ token }).first();
    if (blacklisted) {
      return res.status(401).json({ error: 'Token has been revoked' });
    }

    // Verify and attach user
    req.user = jwt.verify(token, process.env.JWT_SECRET);

    next();
  } catch (error) {
    logger.error(`❌ Auth failed: ${error.message}`);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export default authMiddleware;
