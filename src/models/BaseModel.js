import { Model, snakeCaseMappers } from 'objection';
import db from '../config/db.js';
Model.knex(db);

class BaseModel extends Model {
  static get columnNameMappers() {
    return snakeCaseMappers();
  }
}

export default BaseModel;
