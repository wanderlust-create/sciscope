import BaseModel from './BaseModel.js';
import Bookmark from './Bookmark.js';

class Article extends BaseModel {
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
        urlToImage: { type: ['string', 'null'], format: 'uri' },
        publishedAt: { type: ['string', 'null'], format: 'date-time' },
        authorName: { type: ['string', 'null'] },
        sourceName: { type: ['string', 'null'] },
      },
    };
  }

  static get relationMappings() {
    return {
      bookmarks: {
        relation: BaseModel.HasManyRelation,
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
