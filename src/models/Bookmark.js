import { Model } from 'objection';
import User from './User.js';
import Article from './Article.js';
import BookmarkGroup from './BookmarkGroup.js';

class Bookmark extends Model {
  static get tableName() {
    return 'user_bookmarks';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['user_id', 'article_id'],
      properties: {
        id: { type: 'integer' },
        user_id: { type: 'integer' },
        article_id: { type: 'integer' },
        bookmarked_at: { type: 'string', format: 'date-time' },
      },
    };
  }

  static get relationMappings() {
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'user_bookmarks.user_id',
          to: 'users.id',
        },
      },
      article: {
        relation: Model.BelongsToOneRelation,
        modelClass: Article,
        join: {
          from: 'user_bookmarks.article_id',
          to: 'articles.id',
        },
      },
      bookmarkGroups: {
        relation: Model.ManyToManyRelation,
        modelClass: BookmarkGroup,
        join: {
          from: 'user_bookmarks.id',
          through: {
            from: 'bookmark_group_assignments.user_bookmark_id',
            to: 'bookmark_group_assignments.bookmark_group_id',
          },
          to: 'bookmark_groups.id',
        },
      },
    };
  }
}

export default Bookmark;
