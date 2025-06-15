import express from 'express';
import queryController from '../../controllers/queryController.js';
import { validateNumericParam } from '../../middleware/validateParam.js';

const router = express.Router();

router.get('/', queryController.getNewsByQuery);
router.get('/:id', validateNumericParam('id'), queryController.getArticleById);

export default router;
