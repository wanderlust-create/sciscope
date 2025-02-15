import { Model } from "objection";

class User extends Model {
  static get tableName() {
    return "users";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["username", "email"],

      properties: {
        id: { type: "integer" },
        username: { type: "string", minLength: 3, maxLength: 255 },
        email: { type: "string", format: "email" },
        password_hash: { type: ["string", "null"] },
        oauth_provider: { type: ["string", "null"] },
        oauth_id: { type: ["string", "null"] },
      },
    };
  }

  static get modifiers() {
    return {
      selectWithoutPassword(query) {
        query.select("id", "username", "email", "oauth_provider", "oauth_id");
      },
    };
  }

  static async beforeInsert({ username, email, password_hash, oauth_provider }) {
    if (!password_hash && !oauth_provider) {
      throw new Error("Either `password_hash` or `oauth_provider` is required.");
    }


    const existingUser = await this.query()
      .where({ email })
      .orWhere({ username })
      .first();

    if (existingUser) {
      throw new Error("Username or email already exists.");
    }
  }
}

export default User;

