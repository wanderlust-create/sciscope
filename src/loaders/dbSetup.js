import knex from "knex";
import knexConfig from "../config/knexfile.js";
import dotenv from "dotenv";

dotenv.config();

const env = process.env.NODE_ENV || "development";
const db = knex(knexConfig[env]);

export default db;
// This file sets up the database connection using Knex.js.
