import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import logger from '../loaders/logger.js';

dotenv.config();

const authMiddleware = async (req, res, next) => {
  logger.info('📨 Received auth request', {
    headers: req.headers.authorization?.split(' ')[1],
  });
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    // Check if the token is blacklisted
    const blacklisted = await db('blacklisted_tokens').where({ token }).first();
    if (blacklisted) {
      return res.status(401).json({ error: 'Token has been revoked' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach decoded user info to request

    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export default authMiddleware;
