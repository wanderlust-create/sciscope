import BaseModel from './BaseModel.js';
import User from './User.js';
import Article from './Article.js';
import BookmarkGroup from './BookmarkGroup.js';

class Bookmark extends BaseModel {
  static get tableName() {
    return 'user_bookmarks';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['userId', 'articleId'],
      properties: {
        id: { type: 'integer' },
        userId: { type: 'integer' },
        articleId: { type: 'integer' },
        bookmarkedAt: { type: 'string', format: 'date-time' },
      },
    };
  }

  static get relationMappings() {
    return {
      user: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'user_bookmarks.user_id',
          to: 'users.id',
        },
      },
      article: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: Article,
        join: {
          from: 'user_bookmarks.article_id',
          to: 'articles.id',
        },
      },
      bookmarkGroups: {
        relation: BaseModel.ManyToManyRelation,
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
