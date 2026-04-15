import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, unique: true },
  password: { type: String },
  avatar: { type: String },
  preferredLanguage: { type: String, default: 'en-US' },
  theme: { type: String, default: 'system' },
  // Email Verification & Security
  isVerified: { type: Boolean, default: false },
  authOtp: { type: String },
  authOtpExpire: { type: Date },
  refreshToken: { type: String }, // Store hashed refresh token
  refreshTokenId: { type: String, index: true }, // Unhashed ID for O(1) lookup during refresh
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date },
});

export default mongoose.model('User', UserSchema);
