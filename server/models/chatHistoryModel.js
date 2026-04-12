import mongoose from 'mongoose';

const ChatSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true, maxlength: 200 },
  messages: [
    {
      sender: { type: String, enum: ['user', 'bot', 'bot-temp', 'system'], default: 'user' },
      text: { type: String },
      timestamp: { type: Date, default: Date.now },
      lang: { type: String, default: 'en-US' },
    },
  ],
  uiMode: { type: String, default: 'classic' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Auto-update updatedAt on save
ChatSessionSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('ChatSession', ChatSessionSchema);
