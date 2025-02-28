import express from 'express';
import articleController from '../../controllers/articleController';

const router = express.Router();

router.get('/search', articleController.searchArticles);

export default router;
