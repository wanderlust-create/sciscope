import express from 'express';
import queryController from '../../controllers/queryController.js';
import { validateNumericParam } from '../../middleware';

const router = express.Router();

router.get('/', queryController.getNewsByQuery);
router.get('/:id', validateNumericParam('id'), queryController.getArticleById);

export default router;
