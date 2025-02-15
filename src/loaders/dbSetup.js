import dotenv from "dotenv";
import knex from "knex";
import { Model } from "objection";
import knexConfig from "../config/knexfile.js";

dotenv.config();

const env = process.env.NODE_ENV || "development";
const db = knex(knexConfig[env]);

Model.knex(db);

export default db;
