import { Router } from "express";
import NewsController from "./controllers/newsController.js";

const route = Router();

route.get("/", NewsController.getNews);

export default route;
