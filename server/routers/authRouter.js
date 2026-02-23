import express from 'express';
import * as auth from '../controller/authController.js';
import authMW from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', auth.register);
router.post('/login', auth.login);
router.get('/profile', authMW, auth.profile);
router.put('/profile', authMW, auth.updateProfile);

export default router;
