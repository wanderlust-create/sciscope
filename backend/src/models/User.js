import BaseModel from './BaseModel.js';
import Bookmark from './Bookmark.js';

class User extends BaseModel {
  static get tableName() {
    return 'users';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['username', 'email'],
      properties: {
        id: { type: 'integer' },
        username: { type: 'string', minLength: 3, maxLength: 255 },
        email: { type: 'string', format: 'email' },
        passwordHash: { type: ['string', 'null'] },
        oauthProvider: { type: ['string', 'null'] },
        oauthId: { type: ['string', 'null'] },
      },
    };
  }

  static get relationMappings() {
    return {
      bookmarks: {
        relation: BaseModel.HasManyRelation,
        modelClass: Bookmark,
        join: {
          from: 'users.id',
          to: 'user_bookmarks.user_id', // DB snake_case
        },
      },
    };
  }

  static get modifiers() {
    return {
      selectWithoutPassword(query) {
        query.select('id', 'username', 'email', 'oauth_provider', 'oauth_id');
      },
    };
  }

  static async beforeInsert(args) {
    const data = args.inputItems?.[0];

    if (!data) {
      throw new Error('beforeInsert received no data!');
    }

    const { passwordHash, oauthProvider } = data;

    if (!passwordHash && !oauthProvider) {
      throw new Error('Either `passwordHash` or `oauthProvider` is required.');
    }
  }
}

export default User;
