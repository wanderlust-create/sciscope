// services/AuthService.js
import User from '../models/User.js';
import bcrypt from 'bcrypt';
import { hashPassword } from '../utils/authUtils.js';

const AuthService = {
  async registerUser({ username, email, password }) {
    const password_hash = await hashPassword(password);
    return User.query().insert({ username, email, password_hash });
  },

  async findUserByEmail(email) {
    return User.query().findOne({ email });
  },

  async findUserByUsername(username) {
    return User.query().findOne({ username });
  },

  async verifyPassword(input, storedHash) {
    return bcrypt.compare(input, storedHash);
  },

  async findOAuthUser(provider, oauth_id) {
    return User.query()
      .where('oauth_provider', provider)
      .andWhere('oauth_id', oauth_id)
      .first();
  },

  async createOAuthUser({ username, email, provider, oauth_id }) {
    return User.query().insert({
      username,
      email,
      oauth_provider: provider,
      oauth_id,
    });
  },
};

export default AuthService;
