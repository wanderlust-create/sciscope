import bcrypt from 'bcrypt';
import logger from '../loaders/logger.js';
import User from '../models/User.js';
import db from '../config/db.js';
import {
  findUserByEmail,
  generateToken,
  hashPassword,
} from '../utils/authUtils.js';

const AuthController = {
  // 🔹 Email & Password Signup
  async signup(req, res) {
    try {
      logger.info('📨 Received signup request', { body: req.body });

      const { username, email, password } = req.body;
      if (!username || !email || !password) {
        logger.warn('⚠️ Missing required fields');
        return res.status(400).json({ error: 'All fields are required' });
      }

      const existingUser = await findUserByEmail(email);
      if (existingUser) {
        logger.warn('⚠️ Email or username already exists', { email, username });
        return res
          .status(409)
          .json({ error: 'Email or username already in use' });
      }

      const password_hash = await hashPassword(password);
      const user = await User.query().insert({
        username,
        email,
        password_hash,
      });

      logger.info('✅ User created successfully', { userId: user.id });

      return res
        .status(201)
        .json({ message: 'Signup successful!', token: generateToken(user) });
    } catch (error) {
      logger.error('❌ Error in signup', { error: error.message });
      return res.status(500).json({ error: 'Server error' });
    }
  },

  // 🔹 Email & Password Login
  async login(req, res) {
    try {
      logger.info('📨 Received login request', { body: req.body });

      const { email, password } = req.body;
      if (!email || !password) {
        logger.warn('⚠️ Missing required fields');
        return res.status(400).json({ error: 'All fields are required' });
      }

      const user = await findUserByEmail(email);
      logger.info('👀 Found user in database', { userExists: !!user });

      if (!user || !user.passwordHash) {
        logger.warn('⚠️ Invalid credentials', { email });
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
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

  // 🔹 OAuth Signup/Login
  async oauthLogin(req, res) {
    try {
      logger.info('📨 Received OAuth login request', { body: req.body });

      const { provider, oauth_id, email, username } = req.body;
      if (!provider || !oauth_id || !email) {
        logger.warn('⚠️ Missing OAuth details');
        return res.status(400).json({ error: 'Missing OAuth details' });
      }

      let user = await User.query()
        .where('oauth_provider', provider)
        .andWhere('oauth_id', oauth_id)
        .first();

      if (!user) {
        user = await User.query().insert({
          username,
          email,
          oauth_provider: provider,
          oauth_id,
        });
        logger.info('✅ New OAuth user created', { userId: user.id, provider });
      } else {
        logger.info('✅ OAuth user logged in', { userId: user.id, provider });
      }

      return res.status(200).json({
        message: 'OAuth login successful!',
        token: generateToken(user),
      });
    } catch (error) {
      logger.error('❌ Error in OAuth login', { error: error.message });
      return res.status(500).json({ error: 'Server error' });
    }
  },
  // 🔹 Logout
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
