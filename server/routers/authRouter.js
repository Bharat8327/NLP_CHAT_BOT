import express from 'express';
import * as auth from '../controller/authController.js';
import authMW from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', auth.register);
router.post('/verify-otp', auth.verifyOtp);
router.post('/login', auth.login);
router.get('/refresh', auth.refresh);
router.post('/logout', auth.logout);
router.post('/forgotpassword', auth.forgotPassword);
router.put('/resetpassword/:token', auth.resetPassword);

router.get('/profile', authMW, auth.profile);
router.put('/profile', authMW, auth.updateProfile);

export default router;
