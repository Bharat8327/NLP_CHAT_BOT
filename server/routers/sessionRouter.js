import express from 'express';
import { getAvailableCommands } from '../services/voiceCommandService.js';
import authMW from '../middleware/authMiddleware.js';
import Session from '../models/SessionModel.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/session/preferences
 * Get user session preferences (voice settings, UI mode, etc.)
 */
router.get('/preferences', authMW, async (req, res) => {
  try {
    let session = await Session.findOne({ user: req.user.id, isActive: true })
      .sort({ lastActiveAt: -1 })
      .lean();

    if (!session) {
      // Return defaults
      return res.json({
        preferences: {
          language: 'en-US',
          voiceSpeed: 1,
          voiceType: '',
          uiMode: 'classic',
          autoPlayTTS: false,
        },
        metrics: {
          messagesCount: 0,
          avgResponseTimeMs: 0,
          languagesUsed: [],
          voiceCommandsUsed: 0,
        },
      });
    }

    res.json({
      sessionId: session._id,
      preferences: session.preferences,
      metrics: session.metrics,
    });
  } catch (err) {
    logger.error('Get preferences error', { error: err.message });
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * PUT /api/session/preferences
 * Update user session preferences
 */
router.put('/preferences', authMW, async (req, res) => {
  try {
    const { language, voiceSpeed, voiceType, uiMode, autoPlayTTS } = req.body;

    const updateData = {};
    if (language !== undefined) updateData['preferences.language'] = language;
    if (voiceSpeed !== undefined) updateData['preferences.voiceSpeed'] = voiceSpeed;
    if (voiceType !== undefined) updateData['preferences.voiceType'] = voiceType;
    if (uiMode !== undefined) updateData['preferences.uiMode'] = uiMode;
    if (autoPlayTTS !== undefined) updateData['preferences.autoPlayTTS'] = autoPlayTTS;

    const session = await Session.findOneAndUpdate(
      { user: req.user.id, isActive: true },
      { $set: updateData },
      { new: true, upsert: true }
    );

    logger.info('Preferences updated', { userId: req.user.id });
    res.json({ preferences: session.preferences });
  } catch (err) {
    logger.error('Update preferences error', { error: err.message });
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/session/metrics
 * Get aggregated session metrics
 */
router.get('/metrics', authMW, async (req, res) => {
  try {
    const sessions = await Session.find({ user: req.user.id }).lean();

    const aggregate = {
      totalSessions: sessions.length,
      totalMessages: sessions.reduce((sum, s) => sum + (s.metrics?.messagesCount || 0), 0),
      avgResponseTime: sessions.length
        ? Math.round(
            sessions.reduce((sum, s) => sum + (s.metrics?.avgResponseTimeMs || 0), 0) /
              sessions.length
          )
        : 0,
      languagesUsed: [...new Set(sessions.flatMap((s) => s.metrics?.languagesUsed || []))],
      voiceCommandsUsed: sessions.reduce(
        (sum, s) => sum + (s.metrics?.voiceCommandsUsed || 0),
        0
      ),
    };

    res.json({ metrics: aggregate });
  } catch (err) {
    logger.error('Get metrics error', { error: err.message });
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/session/commands
 * Get available voice commands
 */
router.get('/commands', (_req, res) => {
  res.json({ commands: getAvailableCommands() });
});

export default router;
