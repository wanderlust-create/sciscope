import logger from '../loaders/logger.js';
import db from '../config/db.js';
import { generateToken } from '../utils/authUtils.js';
import authService from '../services/authService.js';

/**
 * Controller for user authentication actions:
 * - Email/password signup and login
 * - OAuth signup and login
 * - Logout and token blacklisting
 */
const AuthController = {
  /**
   * Registers a new user with email and password.
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   * @returns {Promise<Response>} 201 Created with JWT token or 409 Conflict if email exists.
   */
  async signup(req, res) {
    try {
      logger.info('📨 Received signup request', { body: req.body });

      const { username, email, password } = req.body;
      if (!username || !email || !password) {
        logger.warn('⚠️ Missing required fields');
        return res.status(400).json({ error: 'All fields are required' });
      }

      const existingUser = await authService.findUserByEmail(email);
      if (existingUser) {
        logger.warn('⚠️ Email or username already exists', { email, username });
        return res
          .status(409)
          .json({ error: 'Email or username already in use' });
      }

      const user = await authService.registerUser({
        username,
        email,
        password,
      });
      logger.info('✅ User created successfully', { userId: user.id });

      return res.status(201).json({
        message: 'Signup successful!',
        token: generateToken(user),
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
      });
    } catch (error) {
      logger.error('❌ Error in signup', { error: error.message });
      return res.status(500).json({ error: 'Server error' });
    }
  },

  /**
   * Logs in a user with email and password credentials.
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   * @returns {Promise<Response>} 200 OK with JWT token or 401 Unauthorized on failure.
   */
  async login(req, res) {
    try {
      logger.info('📨 Received login request', { body: req.body });

      const { email, password } = req.body;
      if (!email || !password) {
        logger.warn('⚠️ Missing required fields');
        return res.status(400).json({ error: 'All fields are required' });
      }

      const user = await authService.findUserByEmail(email);
      logger.info('👀 Found user in database', { userExists: !!user });

      if (!user || !user.passwordHash) {
        logger.warn('⚠️ Invalid credentials', { email });
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isMatch = await authService.verifyPassword(
        password,
        user.passwordHash
      );
      if (!isMatch) {
        logger.warn('⚠️ Invalid password attempt', { email });
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      return res
        .status(200)
        .json({ message: 'Login successful!', token: generateToken(user) });
    } catch (error) {
      logger.error('❌ Error in login', { error: error.message });
      return res.status(500).json({ error: 'Server error' });
    }
  },

  /**
   * Handles OAuth login or signup:
   * - If user exists, log them in.
   * - If user doesn't exist, create and log in.
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   * @returns {Promise<Response>} 200 OK or 201 Created with JWT token, or 409 Conflict if username/email is taken.
   */
  async oauthLogin(req, res) {
    logger.info('📨 Received OAuth login request', { body: req.body });
    try {
      const { provider, oauthId, email, username } = req.body;

      if (!provider || !oauthId || !email) {
        logger.warn('⚠️ Missing OAuth details');
        return res.status(400).json({ error: 'Missing OAuth details' });
      }

      // Look for existing user by OAuth credentials
      let user = await authService.findOAuthUser(provider, oauthId);
      logger.info('👀 Checked for existing OAuth user', { userExists: !!user });

      if (!user) {
        // Prevent conflict with existing local or OAuth users
        const emailTaken = await authService.findUserByEmail(email);
        const usernameTaken = await authService.findUserByUsername(username);

        if (emailTaken || usernameTaken) {
          logger.warn(
            '⚠️ Cannot auto-create OAuth user: email or username already taken',
            {
              emailTaken: !!emailTaken,
              usernameTaken: !!usernameTaken,
            }
          );
          return res.status(409).json({
            error:
              'Login unsuccessful. An account with this email or username already exists. Please check your information and try again.',
          });
        }

        // If no existing User - Create new OAuth user
        user = await authService.createOAuthUser({
          username,
          email,
          provider,
          oauthId,
        });

        logger.info('✅ New OAuth user created', { userId: user.id, provider });
        return res.status(201).json({
          message: 'OAuth signup successful!',
          token: generateToken(user),
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
          },
        });
      } else {
        logger.info('✅ OAuth user logged in', { userId: user.id, provider });
      }
      return res.status(200).json({
        message: 'OAuth login successful!',
        token: generateToken(user),
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
      });
    } catch (error) {
      logger.error('❌ Error in OAuth login', { error: error.message });
      return res.status(500).json({ error: 'Server error' });
    }
  },

  /**
   * Logs out the user by blacklisting the current JWT token.
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   * @returns {Promise<Response>} 200 OK on successful logout.
   */
  async logout(req, res) {
    logger.info('📨 Received logout request');
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(400).json({ error: 'No token provided' });
      }
      // Add token to the blacklist
      await db('blacklisted_tokens').insert({ token });

      logger.info('🚪 User logged out, token blacklisted');

      return res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
      logger.error('❌ Error in logout', { error: error.message });
      return res.status(500).json({ error: 'Server error' });
    }
  },
};

export default AuthController;
