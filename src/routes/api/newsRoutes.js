import { Router } from 'express';
import NewsController from '../../controllers/newsController.js';

const route = Router();

route.get('/', NewsController.getScienceNews);

export default route;
