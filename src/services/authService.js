import User from '../models/User.js';
import bcrypt from 'bcrypt';
import { hashPassword } from '../utils/authUtils.js';

/**
 * Service layer for user authentication logic.
 * Handles password-based and OAuth-based user registration and login.
 */
const AuthService = {
  /**
   * Registers a new user with hashed password.
   * @param {Object} userDetails
   * @param {string} userDetails.username - New user's username.
   * @param {string} userDetails.email - New user's email.
   * @param {string} userDetails.password - New user's plaintext password.
   * @returns {Promise<Object>} The inserted user record.
   */
  async registerUser({ username, email, password }) {
    const passwordHash = await hashPassword(password);
    return User.query().insert({ username, email, passwordHash });
  },

  /**
   * Finds a user by their email address.
   * @param {string} email - Email to search for.
   * @returns {Promise<Object|null>} User record if found, otherwise null.
   */
  async findUserByEmail(email) {
    return User.query().findOne({ email });
  },

  /**
   * Finds a user by their username.
   * @param {string} username - Username to search for.
   * @returns {Promise<Object|null>} User record if found, otherwise null.
   */
  async findUserByUsername(username) {
    return User.query().findOne({ username });
  },

  /**
   * Verifies a plaintext password against a stored hash.
   * @param {string} input - Plaintext password input.
   * @param {string} storedHash - Stored bcrypt hash.
   * @returns {Promise<boolean>} True if match, false otherwise.
   */
  async verifyPassword(input, storedHash) {
    return bcrypt.compare(input, storedHash);
  },

  /**
   * Finds an OAuth user by provider and OAuth ID.
   * @param {string} provider - OAuth provider (e.g., google, github).
   * @param {string} oauth_id - OAuth user ID.
   * @returns {Promise<Object|null>} User record if found, otherwise null.
   */
  async findOAuthUser(provider, oauth_id) {
    return User.query()
      .where('oauth_provider', provider)
      .andWhere('oauth_id', oauth_id)
      .first();
  },

  /**
   * Creates a new OAuth user record.
   * @param {Object} oauthDetails
   * @param {string} oauthDetails.username - Username.
   * @param {string} oauthDetails.email - Email.
   * @param {string} oauthDetails.provider - OAuth provider.
   * @param {string} oauthDetails.oauth_id - OAuth user ID.
   * @returns {Promise<Object>} The inserted OAuth user record.
   */
  async createOAuthUser({ username, email, provider, oauthId }) {
    return User.query().insert({
      username,
      email,
      oauthProvider: provider,
      oauthId,
    });
  },
};

export default AuthService;
