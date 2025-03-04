import { Model } from 'objection';
import Bookmark from './Bookmark.js'; // ✅ Import Bookmark model

class User extends Model {
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
        password_hash: { type: ['string', 'null'] }, // 🔹 DB uses this
        oauth_provider: { type: ['string', 'null'] },
        oauth_id: { type: ['string', 'null'] },
      },
    };
  }

  static get relationMappings() {
    return {
      bookmarks: {
        relation: Model.HasManyRelation,
        modelClass: Bookmark,
        join: {
          from: 'users.id',
          to: 'user_bookmarks.user_id',
        },
      },
    };
  }

  static get virtualAttributes() {
    return ['passwordHash'];
  }

  // ✅ Virtual Getter for JS-friendly property
  get passwordHash() {
    return this.password_hash;
  }

  // ✅ Virtual Setter for consistency
  set passwordHash(value) {
    this.password_hash = value;
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

    const { passwordHash, oauth_provider } = data; // 🔹 Use `passwordHash`

    if (!passwordHash && !oauth_provider) {
      throw new Error('Either `passwordHash` or `oauth_provider` is required.');
    }
  }
}

export default User;
