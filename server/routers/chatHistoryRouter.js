import express from 'express';
import {
  saveSession,
  getSessions,
  getSession,
  deleteSession,
  deleteAll,
} from '../controller/chatHistoryController.js';
import authMW from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all routes with authentication
router.use(authMW);

// Create or update a chat session
router.post('/', saveSession);

// Get all chat sessions for the logged-in user
router.get('/', getSessions);

// Get a single chat session by ID
router.get('/:id', getSession);

// Delete all chat sessions (must come before /:id to avoid route conflict)
router.delete('/all', deleteAll);

// Delete a single chat session by ID
router.delete('/:id', deleteSession);

export default router;
