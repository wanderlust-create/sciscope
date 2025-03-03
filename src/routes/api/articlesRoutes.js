import express from 'express';
import queryController from '../../controllers/queryController';

const router = express.Router();

router.get('/', queryController.getNewsByQuery);

export default router;
