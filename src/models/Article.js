import { Model } from 'objection';
import db from '../config/db.js';
import Bookmark from './Bookmark.js';

Model.knex(db);

class Article extends Model {
  static get tableName() {
    return 'articles';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['title', 'url'],
      properties: {
        id: { type: 'integer' },
        title: { type: 'string', minLength: 1, maxLength: 255 },
        description: { type: ['string', 'null'] },
        url: { type: 'string', format: 'uri' },
        url_to_image: { type: ['string', 'null'], format: 'uri' },
        published_at: { type: ['string', 'null'], format: 'date-time' },
        author_name: { type: ['string', 'null'] },
        source_name: { type: ['string', 'null'] },
      },
    };
  }

  static get relationMappings() {
    return {
      bookmarks: {
        relation: Model.HasManyRelation,
        modelClass: Bookmark,
        join: {
          from: 'articles.id',
          to: 'user_bookmarks.article_id',
        },
      },
    };
  }
}

export default Article;
