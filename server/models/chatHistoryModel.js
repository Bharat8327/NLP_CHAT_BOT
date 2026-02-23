const mongoose = require('mongoose');
const ChatSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: String,
  messages: [
    {
      sender: String,
      text: String,
      timestamp: Date,
      lang: String,
    },
  ],
  createdAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model('ChatSession', ChatSessionSchema);
