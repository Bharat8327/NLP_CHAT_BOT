import ChatSession from '../models/chatHistoryModel.js';
import mongoose from 'mongoose';
import logger from '../utils/logger.js';

/**
 * Sanitize message text to prevent stored XSS
 */
const sanitizeText = (text) => {
  if (typeof text !== 'string') return '';
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

/**
 * Validate that req.user exists and has an id
 */
const validateAuth = (req, res) => {
  if (!req.user || !req.user.id) {
    res.status(401).json({ error: 'Authentication required' });
    return false;
  }
  return true;
};

/**
 * Save a new chat session or update an existing one.
 * POST /api/chat
 */
export const saveSession = async (req, res) => {
  try {
    if (!validateAuth(req, res)) return;

    const { title, messages, chatId, uiMode } = req.body;

    if (!title || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Title and messages are required' });
    }

    if (title.length > 200) {
      return res.status(400).json({ error: 'Title must be under 200 characters' });
    }

    if (messages.length > 500) {
      return res.status(400).json({ error: 'Too many messages in a single session' });
    }

    // Sanitize and validate messages
    const sanitizedMessages = messages.map((m) => {
      const parsed = m.timestamp ? new Date(m.timestamp) : new Date();
      const sender = m.type || m.sender || 'user';
      // Validate sender type
      const validSenders = ['user', 'bot', 'bot-temp', 'system'];
      return {
        sender: validSenders.includes(sender) ? sender : 'user',
        text: sanitizeText(m.content || m.text || ''),
        timestamp: isNaN(parsed.getTime()) ? new Date() : parsed,
        lang: typeof m.lang === 'string' ? m.lang.slice(0, 10) : 'en-US',
      };
    });

    const validUiModes = ['classic', 'voice', 'dashboard', 'avatar'];
    const safeUiMode = validUiModes.includes(uiMode) ? uiMode : 'classic';

    // If chatId provided, update existing session
    if (chatId) {
      if (!mongoose.Types.ObjectId.isValid(chatId)) {
        return res.status(400).json({ error: 'Invalid chat ID format' });
      }

      const existing = await ChatSession.findOneAndUpdate(
        { _id: chatId, user: req.user.id },
        {
          title: title.trim().slice(0, 200),
          messages: sanitizedMessages,
          uiMode: safeUiMode,
          updatedAt: new Date(),
        },
        { new: true }
      );

      if (existing) {
        logger.info('Chat session updated', { chatId, messageCount: messages.length });
        return res.json({ id: existing._id, updated: true });
      }
      // If chatId was provided but not found, fall through to create new
    }

    // Create new session
    const sess = await ChatSession.create({
      user: req.user.id,
      title: title.trim().slice(0, 200),
      messages: sanitizedMessages,
      uiMode: safeUiMode,
    });

    logger.info('Chat session created', { id: sess._id, messageCount: messages.length });
    res.status(201).json({ id: sess._id });
  } catch (err) {
    // Handle duplicate key errors gracefully
    if (err.code === 11000) {
      logger.warn('Duplicate session creation attempt', { error: err.message });
      return res.status(409).json({ error: 'Session already exists' });
    }
    logger.error('saveSession error', { error: err.message });
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Get all sessions for the authenticated user.
 * GET /api/chat
 */
export const getSessions = async (req, res) => {
  try {
    if (!validateAuth(req, res)) return;

    const sessions = await ChatSession.find({ user: req.user.id })
      .select('-__v')
      .sort({ updatedAt: -1 })
      .lean();

    // Transform sessions to match frontend's store format
    const formatted = sessions.map((s) => ({
      id: s._id.toString(),
      title: s.title,
      timestamp: s.updatedAt?.toISOString().slice(0, 10) || s.createdAt?.toISOString().slice(0, 10),
      uiMode: s.uiMode || 'classic',
      messages: s.messages.map((m) => ({
        id: m._id?.toString() || Date.now().toString(),
        type: m.sender || 'user',
        content: m.text || '',
        timestamp: m.timestamp ? new Date(m.timestamp).toLocaleTimeString() : '',
        lang: m.lang || 'en-US',
      })),
      messageCount: s.messages?.length || 0,
    }));

    res.json({ sessions: formatted });
  } catch (err) {
    logger.error('getSessions error', { error: err.message });
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Get a single session by ID.
 * GET /api/chat/:id
 */
export const getSession = async (req, res) => {
  try {
    if (!validateAuth(req, res)) return;

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid session ID' });
    }

    const session = await ChatSession.findOne({ _id: id, user: req.user.id })
      .select('-__v')
      .lean();

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const formatted = {
      id: session._id.toString(),
      title: session.title,
      timestamp: session.updatedAt?.toISOString().slice(0, 10),
      uiMode: session.uiMode || 'classic',
      messages: session.messages.map((m) => ({
        id: m._id?.toString() || Date.now().toString(),
        type: m.sender || 'user',
        content: m.text || '',
        timestamp: m.timestamp ? new Date(m.timestamp).toLocaleTimeString() : '',
        lang: m.lang || 'en-US',
      })),
    };

    res.json({ session: formatted });
  } catch (err) {
    logger.error('getSession error', { error: err.message });
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Delete a single session.
 * DELETE /api/chat/:id
 */
export const deleteSession = async (req, res) => {
  try {
    if (!validateAuth(req, res)) return;

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid session ID' });
    }

    const result = await ChatSession.deleteOne({ _id: id, user: req.user.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    logger.info('Chat session deleted', { id });
    res.json({ ok: 1 });
  } catch (err) {
    logger.error('deleteSession error', { error: err.message });
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Delete all sessions for the authenticated user.
 * DELETE /api/chat/all
 */
export const deleteAll = async (req, res) => {
  try {
    if (!validateAuth(req, res)) return;

    const result = await ChatSession.deleteMany({ user: req.user.id });
    logger.info('All chat sessions deleted', { userId: req.user.id, deleted: result.deletedCount });
    res.json({ ok: 1, deleted: result.deletedCount });
  } catch (err) {
    logger.error('deleteAll error', { error: err.message });
    res.status(500).json({ error: 'Server error' });
  }
};
