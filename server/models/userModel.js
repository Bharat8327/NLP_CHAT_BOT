import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, unique: true },
  password: { type: String },
  avatar: { type: String },
  preferredLanguage: { type: String, default: 'en-US' },
  theme: { type: String, default: 'system' },
});

export default mongoose.model('User', UserSchema);
