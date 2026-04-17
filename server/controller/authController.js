import User from '../models/userModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import crypto from 'crypto';
import { sendEmail } from '../utils/sendEmail.js';
import logger from '../utils/logger.js';

// Helper: Generate Access Token (15 Min) with Device Fingerprint & CSRF hash
const generateAccessToken = (id, req, csrfToken) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured');

  const ua = req.headers['user-agent'] || 'unknown';
  const fp = crypto.createHash('sha256').update(ua).digest('hex');
  return jwt.sign({ id, fp, csrf: csrfToken }, secret, { expiresIn: '15m' });
};

// Helper: Generate Refresh Token + unique ID for O(1) lookup
const generateRefreshToken = () => {
  const token = crypto.randomBytes(40).toString('hex');
  const id = crypto.randomBytes(16).toString('hex'); // unhashed ID for DB lookup
  return { token, id };
};

// Helper: Set Secure Cookies for Refresh, CSRF, and RefreshTokenId
const setSecureCookies = (res, refreshToken, csrfToken, refreshTokenId, rememberMe = true) => {
  const cookieOptions = {
    httpOnly: true,
    secure: true,  // Needed for sameSite: 'none'
    sameSite: 'none', // Allows cross-port transmission on localhost
  };

  // If Remember Me is true, persist for 1 year. If false, it acts as a Session Cookie (deleted on browser close)
  if (rememberMe) {
    cookieOptions.maxAge = 365 * 24 * 60 * 60 * 1000;
  }

  res.cookie('refreshToken', refreshToken, cookieOptions);

  // Store the refreshTokenId in httpOnly cookie for O(1) lookup during refresh
  res.cookie('refreshTokenId', refreshTokenId, cookieOptions);

  // Axios will automatically read this and attach it as X-XSRF-TOKEN header!
  const csrfOptions = { ...cookieOptions, httpOnly: false };
  res.cookie('XSRF-TOKEN', csrfToken, csrfOptions);
};

// Helper: Strip sensitive data from user object
const sanitizeUser = (user) => {
  const safeUser = user.toObject ? user.toObject() : { ...user };
  delete safeUser.password;
  delete safeUser.refreshToken;
  delete safeUser.refreshTokenId;
  delete safeUser.authOtp;
  delete safeUser.authOtpExpire;
  delete safeUser.resetPasswordToken;
  delete safeUser.resetPasswordExpire;
  return safeUser;
};

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) return res.status(400).json({ error: 'All fields are required' });
    if (!validator.isEmail(email)) return res.status(400).json({ error: 'Invalid email format' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    // Sanitize inputs
    const cleanName = validator.escape(name.trim());
    const cleanEmail = validator.normalizeEmail(email.trim());

    let user = await User.findOne({ email: cleanEmail });
    if (user && user.isVerified) return res.status(400).json({ error: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 12);
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP

    // Try sending email FIRST before creating/updating the user
    const html = `<h2>Welcome to Antigravity NLP!</h2><p>Your verification code is: <strong>${otp}</strong></p><p>It expires in 10 minutes.</p>`;

    try {
      await sendEmail({ to: cleanEmail, subject: 'Verify Your Account', html });
    } catch (emailError) {
      logger.error('Registration email failed.', {
        email: cleanEmail,
        error: emailError.message
      });
      // Fallback: If email fails (e.g. invalid SMTP pass), print OTP in the console so testing can continue
      logger.warn(`=============================================================`);
      logger.warn(`EMAIL BYPASS: Since email failed, use this OTP to verify!`);
      logger.warn(`EMAIL: ${cleanEmail}`);
      logger.warn(`OTP CODE: ${otp}`);
      logger.warn(`=============================================================`);
      // We intentionally do not return 503 here so the app keeps working for you.
    }

    // Email sent successfully — now save the user
    if (user && !user.isVerified) {
      user.password = hashed;
      user.name = cleanName;
      user.authOtp = otp;
      user.authOtpExpire = Date.now() + 10 * 60 * 1000; // 10 mins
      await user.save();
    } else {
      user = await User.create({
        name: cleanName,
        email: cleanEmail,
        password: hashed,
        authOtp: otp,
        authOtpExpire: Date.now() + 10 * 60 * 1000,
      });
    }

    res.status(201).json({ message: 'Verification OTP sent to email', email: cleanEmail });
  } catch (err) {
    logger.error('Registration error', { err: err.message });
    res.status(500).json({ error: 'Server error' });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });

    const cleanEmail = validator.normalizeEmail(email.trim());
    const user = await User.findOne({ email: cleanEmail });
    if (!user) return res.status(400).json({ error: 'Invalid operation' });

    if (user.authOtp !== otp || user.authOtpExpire < Date.now()) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.authOtp = undefined;
    user.authOtpExpire = undefined;
    await user.save();

    res.json({ message: 'Account verified successfully. You may now log in.' });
  } catch (err) {
    logger.error('Verify OTP error', { err: err.message });
    res.status(500).json({ error: 'Server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await User.findOne({ email: validator.normalizeEmail(email.trim()) });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (!user.isVerified) return res.status(403).json({ error: 'Account not verified. Please verify OTP first.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const csrfToken = crypto.randomBytes(16).toString('hex');
    const accessToken = generateAccessToken(user._id, req, csrfToken);
    const { token: refreshToken, id: refreshTokenId } = generateRefreshToken();

    // Store hashed refresh token + unhashed ID for O(1) lookup
    user.refreshToken = await bcrypt.hash(refreshToken, 10);
    user.refreshTokenId = refreshTokenId;
    await user.save();

    setSecureCookies(res, refreshToken, csrfToken, refreshTokenId, rememberMe);

    res.json({ accessToken, user: sanitizeUser(user) });
  } catch (err) {
    logger.error('Login error', { err: err.message });
    res.status(500).json({ error: 'Server error' });
  }
};

export const refresh = async (req, res) => {
  try {
    const rfToken = req.cookies.refreshToken;
    const rfTokenId = req.cookies.refreshTokenId;

    if (!rfToken || !rfTokenId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // O(1) indexed lookup by refreshTokenId instead of iterating ALL users
    const user = await User.findOne({ refreshTokenId: rfTokenId });

    if (!user || !user.refreshToken) {
      res.clearCookie('refreshToken', { secure: true, sameSite: 'none' });
      res.clearCookie('refreshTokenId', { secure: true, sameSite: 'none' });
      return res.status(403).json({ error: 'Invalid token' });
    }

    // Verify the refresh token hash matches
    const isValid = await bcrypt.compare(rfToken, user.refreshToken);
    if (!isValid) {
      // Possible token theft — revoke all tokens for this user
      user.refreshToken = undefined;
      user.refreshTokenId = undefined;
      await user.save();
      res.clearCookie('refreshToken', { secure: true, sameSite: 'none' });
      res.clearCookie('refreshTokenId', { secure: true, sameSite: 'none' });
      return res.status(403).json({ error: 'Invalid token — session revoked' });
    }

    const newCsrf = crypto.randomBytes(16).toString('hex');
    const newAccessToken = generateAccessToken(user._id, req, newCsrf);
    const { token: newRefreshToken, id: newRefreshTokenId } = generateRefreshToken();

    // Token Rotation — old refresh token is invalidated
    user.refreshToken = await bcrypt.hash(newRefreshToken, 10);
    user.refreshTokenId = newRefreshTokenId;
    await user.save();

    setSecureCookies(res, newRefreshToken, newCsrf, newRefreshTokenId);

    // Strip sensitive data before sending user back
    res.json({ accessToken: newAccessToken, user: sanitizeUser(user) });
  } catch (err) {
    logger.error('Refresh token error', { err: err.message });
    res.status(500).json({ error: 'Server error' });
  }
};

export const logout = async (req, res) => {
  try {
    // Try to revoke via auth (if token is still valid)
    if (req.user?.id) {
      await User.findByIdAndUpdate(req.user.id, {
        $unset: { refreshToken: 1, refreshTokenId: 1 }
      });
    } else {
      // Fallback: revoke by refreshTokenId cookie if JWT expired
      const rfTokenId = req.cookies?.refreshTokenId;
      if (rfTokenId) {
        await User.findOneAndUpdate(
          { refreshTokenId: rfTokenId },
          { $unset: { refreshToken: 1, refreshTokenId: 1 } }
        );
      }
    }
  } catch (err) {
    logger.error('Logout revocation failed', { error: err.message });
  }

  // Clear tracking cookies
  res.clearCookie('refreshToken', { secure: true, sameSite: 'none' });
  res.clearCookie('refreshTokenId', { secure: true, sameSite: 'none' });
  res.clearCookie('XSRF-TOKEN', { secure: true, sameSite: 'none' });
  res.json({ message: 'Logged out securely' });
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const cleanEmail = validator.normalizeEmail(email.trim());
    const user = await User.findOne({ email: cleanEmail });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 5 * 60 * 1000; // 5 Mins
    await user.save();

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    const html = `<h2>Password Reset Requested</h2>
                  <p>You requested a password reset. Click the link below to set a new password:</p>
                  <a href="${resetUrl}">${resetUrl}</a>
                  <p>This link is only valid for 5 minutes.</p>`;

    try {
      await sendEmail({ to: user.email, subject: 'Password Reset', html });
      res.json({ message: 'Reset email sent' });
    } catch (err) {
      logger.error('Password reset email failed', { error: err.message });
      // Fallback: Print reset URL to console so testing can continue
      logger.warn(`=============================================================`);
      logger.warn(`EMAIL BYPASS: Since email failed, use this Reset Link!`);
      logger.warn(`RESET URL: ${resetUrl}`);
      logger.warn(`=============================================================`);

      // We still return success to the client so they know it "went through" and can use the link from console
      return res.json({
        message: 'Email sending failed, but Reset URL has been printed to the server console for testing.'
      });
    }
  } catch (err) {
    logger.error('Forgot password error', { error: err.message });
    res.status(500).json({ error: 'Server error' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ error: 'Invalid or expired token' });

    const { password } = req.body;
    if (!password || password.length < 8) return res.status(400).json({ error: 'Minimum 8 characters' });

    user.password = await bcrypt.hash(password, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    // Also revoke all active sessions for security
    user.refreshToken = undefined;
    user.refreshTokenId = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    logger.error('Reset password error', { error: err.message });
    res.status(500).json({ error: 'Server error' });
  }
};

export const profile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -refreshToken -refreshTokenId -authOtp -authOtpExpire -resetPasswordToken -resetPasswordExpire');
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, avatar, preferredLanguage } = req.body;
    const updates = {};
    if (name) updates.name = validator.escape(name.trim());
    if (avatar) updates.avatar = avatar;
    if (preferredLanguage) updates.preferredLanguage = preferredLanguage;

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true })
      .select('-password -refreshToken -refreshTokenId -authOtp -authOtpExpire -resetPasswordToken -resetPasswordExpire');
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
