import User from '../models/userModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import crypto from 'crypto';
import { sendEmail } from '../utils/sendEmail.js';
import logger from '../utils/logger.js';
import { error } from 'console';

// Helper: Generate Access Token (15 Min) with Device Fingerprint & CSRF hash
const generateAccessToken = (id, req, csrfToken) => {
  const ua = req.headers['user-agent'] || 'unknown';
  const fp = crypto.createHash('sha256').update(ua).digest('hex');
  return jwt.sign({ id, fp, csrf: csrfToken }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '15m' });
};

// Helper: Generate Refresh Token
const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

// Helper: Set Secure Cookies for Refresh and CSRF
const setSecureCookies = (res, refreshToken, csrfToken, rememberMe = true) => {
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
  
  // Axios will automatically read this and attach it as X-XSRF-TOKEN header!
  const csrfOptions = { ...cookieOptions, httpOnly: false };
  res.cookie('XSRF-TOKEN', csrfToken, csrfOptions);
};

export const register = async (req, res) => {
  try {
    console.log(req.body);

    const { name, email, password } = req.body;

    if (!name || !email || !password) return res.status(400).json({ error: 'All fields are required' });
    if (!validator.isEmail(email)) return res.status(400).json({ error: 'Invalid email format' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    let user = await User.findOne({ email });
    if (user && user.isVerified) return res.status(400).json({ error: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 12);
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
    console.log(1);

    if (user && !user.isVerified) {
      user.password = hashed;
      user.name = name;
      user.authOtp = otp;
      user.authOtpExpire = Date.now() + 10 * 60 * 1000; // 10 mins
      await user.save();
    } else {
      user = await User.create({
        name,
        email,
        password: hashed,
        authOtp: otp,
        authOtpExpire: Date.now() + 10 * 60 * 1000,
      });
    }
    console.log(2);

    const html = `<h2>Welcome to Antigravity NLP!</h2><p>Your verification code is: <strong>${otp}</strong></p><p>It expires in 10 minutes.</p>`;
    await sendEmail({ to: email, subject: 'Verify Your Account', html });
    console.log(3);

    res.status(201).json({ message: 'Verification OTP sent to email', email });
  } catch (err) {
    console.log(error);

    logger.error('Registration error', { err: err.message });
    res.status(500).json({ error: 'Server error' });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });

    const user = await User.findOne({ email });
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

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (!user.isVerified) return res.status(403).json({ error: 'Account not verified. Please verify OTP first.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const csrfToken = crypto.randomBytes(16).toString('hex');
    const accessToken = generateAccessToken(user._id, req, csrfToken);
    const refreshToken = generateRefreshToken();

    // Secure Token Revocation - Prevents Old tokens surviving
    user.refreshToken = await bcrypt.hash(refreshToken, 10);
    await user.save();

    setSecureCookies(res, refreshToken, csrfToken, rememberMe);

    const safeUser = user.toObject();
    delete safeUser.password;
    delete safeUser.refreshToken;

    res.json({ accessToken, user: safeUser });
  } catch (err) {
    logger.error('Login error', { err: err.message });
    res.status(500).json({ error: 'Server error' });
  }
};

export const refresh = async (req, res) => {
  try {
    const rfToken = req.cookies.refreshToken;
    if (!rfToken) return res.status(401).json({ error: 'Not authenticated' });

    const users = await User.find({ refreshToken: { $exists: true } });
    let validUser = null;

    // We must find the user whose hashed refresh token matches
    for (const u of users) {
      if (await bcrypt.compare(rfToken, u.refreshToken)) {
        validUser = u;
        break;
      }
    }

    if (!validUser) {
      res.clearCookie('refreshToken');
      return res.status(403).json({ error: 'Invalid token' });
    }

    const newCsrf = crypto.randomBytes(16).toString('hex');
    const newAccessToken = generateAccessToken(validUser._id, req, newCsrf);
    const newRefreshToken = generateRefreshToken();

    // Token Rotation Blacklist mechanism
    validUser.refreshToken = await bcrypt.hash(newRefreshToken, 10);
    await validUser.save();

    setSecureCookies(res, newRefreshToken, newCsrf);
    res.json({ accessToken: newAccessToken, user: validUser });
  } catch (err) {
    logger.error('Refresh token error', { err: err.message });
    res.status(500).json({ error: 'Server error' });
  }
};

export const logout = async (req, res) => {
  try {
    const rfToken = req.cookies?.refreshToken;
    if (rfToken && req.user) {
      // Find the user and securely revoke memory of their active refresh token
      await User.findByIdAndUpdate(req.user.id, { $unset: { refreshToken: 1 } });
    }
  } catch (err) {
    logger.error('Logout revocation failed', err);
  }

  // Clear tracking cookies
  res.clearCookie('refreshToken', { secure: true, sameSite: 'none' });
  res.clearCookie('XSRF-TOKEN', { secure: true, sameSite: 'none' });
  res.json({ message: 'Logged out securely' });
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 5 * 60 * 1000; // 5 Mins
    await user.save();

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5174';
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    const html = `<h2>Password Reset Requested</h2>
                  <p>You requested a password reset. Click the link below to set a new password:</p>
                  <a href="${resetUrl}">${resetUrl}</a>
                  <p>This link is only valid for 5 minutes.</p>`;

    try {
      await sendEmail({ to: user.email, subject: 'Password Reset', html });
      res.json({ message: 'Reset email sent' });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return res.status(500).json({ error: 'Email could not be sent' });
    }
  } catch (err) {
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
    if (password.length < 8) return res.status(400).json({ error: 'Minimum 8 characters' });

    user.password = await bcrypt.hash(password, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const profile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -refreshToken');
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
    if (name) updates.name = name;
    if (avatar) updates.avatar = avatar;
    if (preferredLanguage) updates.preferredLanguage = preferredLanguage;

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password -refreshToken');
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
