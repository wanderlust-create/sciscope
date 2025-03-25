import express from 'express';
import queryController from '../../controllers/queryController.js';

const router = express.Router();

router.get('/', queryController.getNewsByQuery);
router.get('/:id', queryController.getArticleById);

export default router;
