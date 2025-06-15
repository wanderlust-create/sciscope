import express from 'express';
import authMiddleware from '../../middleware/authMiddleware.js';

const router = express.Router();

router.get('/protected-route', authMiddleware, (req, res) => {
  res.status(200).json({ message: 'You accessed a protected route!' });
});

export default router;
