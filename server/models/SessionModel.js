import mongoose from 'mongoose';

/**
 * SessionModel — stores user session preferences, context, and voice settings.
 * This is separate from ChatSession (which stores conversation history).
 */
const SessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  socketId: { type: String },

  // Conversation context (last 10 turns for quick reload)
  context: [
    {
      role: { type: String, enum: ['user', 'assistant'] },
      content: { type: String },
      timestamp: { type: Date, default: Date.now },
    },
  ],

  // User preferences for this session
  preferences: {
    language: { type: String, default: 'en-US' },
    voiceSpeed: { type: Number, default: 1, min: 0.5, max: 2 },
    voiceType: { type: String, default: '' },
    uiMode: { type: String, enum: ['classic', 'voice', 'dashboard', 'avatar'], default: 'classic' },
    autoPlayTTS: { type: Boolean, default: false },
  },

  // Session metadata
  startedAt: { type: Date, default: Date.now },
  lastActiveAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },

  // Metrics for this session
  metrics: {
    messagesCount: { type: Number, default: 0 },
    avgResponseTimeMs: { type: Number, default: 0 },
    languagesUsed: [{ type: String }],
    voiceCommandsUsed: { type: Number, default: 0 },
  },
});

// Auto-expire sessions after 24h of inactivity
SessionSchema.index({ lastActiveAt: 1 }, { expireAfterSeconds: 86400 });

// Limit context to 20 entries
SessionSchema.pre('save', function (next) {
  if (this.context && this.context.length > 20) {
    this.context = this.context.slice(-20);
  }
  this.lastActiveAt = new Date();
  next();
});

export default mongoose.model('Session', SessionSchema);
