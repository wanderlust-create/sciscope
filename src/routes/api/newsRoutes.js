import { Router } from 'express';
import newsController from '../../controllers/newsController.js';

const router = Router();

router.get('/', newsController.getScienceNews);

export default router;
