import express from 'express';
import {
  register,
  login,
  profile,
  updateProfile,
} from '../controller/authController.js';
import authMW from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authMW, profile);
router.put('/profile', authMW, updateProfile);

export default router;
