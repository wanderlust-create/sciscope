import BaseModel from './BaseModel.js';
import User from './User.js';
import Bookmark from './Bookmark.js';

class BookmarkGroup extends BaseModel {
  static get tableName() {
    return 'bookmark_groups';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['userId', 'groupName'],
      properties: {
        id: { type: 'integer' },
        userId: { type: 'integer' },
        groupName: { type: 'string', maxLength: 255 },
        createdAt: { type: 'string', format: 'date-time' },
      },
    };
  }

  static get relationMappings() {
    return {
      user: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'bookmark_groups.user_id',
          to: 'users.id',
        },
      },
      bookmarks: {
        relation: BaseModel.ManyToManyRelation,
        modelClass: Bookmark,
        join: {
          from: 'bookmark_groups.id',
          through: {
            from: 'bookmark_group_assignments.bookmark_group_id',
            to: 'bookmark_group_assignments.user_bookmark_id',
          },
          to: 'user_bookmarks.id',
        },
      },
    };
  }
}

export default BookmarkGroup;
