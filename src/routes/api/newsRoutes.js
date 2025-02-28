import { Router } from 'express';
import newsController from '../../controllers/newsController.js';

const route = Router();

route.get('/', newsController.getScienceNews);

export default route;
