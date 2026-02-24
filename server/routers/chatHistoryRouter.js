// routes/chatHistoryRoutes.js
const express = require('express');
const {
  saveSession,
  getSessions,
  deleteSession,
  deleteAll,
} = require('../controller/chatHistoryController.js');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Protect all routes with authentication
router.use(authMiddleware);

// Create a new chat session
router.post('/', saveSession);

// Get all chat sessions for the logged-in user
router.get('/', getSessions);

// Delete a single chat session by ID
router.delete('/:id', deleteSession);

// Delete all chat sessions for the logged-in user
router.delete('/', deleteAll);

export default router;
