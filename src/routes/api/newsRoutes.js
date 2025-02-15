import { Router } from "express";
import NewsController from "../../controllers/newsController";

const route = Router();

route.get("/", NewsController.getNews);

export default route;
