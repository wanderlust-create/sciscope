import { Model } from 'objection';
import User from './User.js';
import Bookmark from './Bookmark.js';

class BookmarkGroup extends Model {
  static get tableName() {
    return 'bookmark_groups';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['user_id', 'group_name'],
      properties: {
        id: { type: 'integer' },
        user_id: { type: 'integer' },
        group_name: { type: 'string', maxLength: 255 },
        created_at: { type: 'string', format: 'date-time' },
      },
    };
  }

  static get relationMappings() {
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'bookmark_groups.user_id',
          to: 'users.id',
        },
      },
      bookmarks: {
        relation: Model.ManyToManyRelation,
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
