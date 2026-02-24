const ChatSession = require('../models/chatHistoryModel');
const mongoose = require('mongoose');
const validator = require('validator');

// SAVE SESSION
exports.saveSession = async (req, res) => {
  try {
    const { title, messages } = req.body;

    // Validate inputs
    if (!title || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Title and messages are required' });
    }
    if (!validator.isLength(title, { min: 1, max: 100 })) {
      return res.status(400).json({ error: 'Title must be 1–100 characters' });
    }

    const sess = await ChatSession.create({
      user: req.user.id,
      title: validator.escape(title),
      messages,
    });

    res.status(201).json({ id: sess._id });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// GET ALL SESSIONS
exports.getSessions = async (req, res) => {
  try {
    const all = await ChatSession.find({ user: req.user.id }).select('-__v');
    res.json({ sessions: all });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// DELETE SINGLE SESSION
exports.deleteSession = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid session ID' });
    }

    const result = await ChatSession.deleteOne({ _id: id, user: req.user.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ ok: 1 });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// DELETE ALL SESSIONS
exports.deleteAll = async (req, res) => {
  try {
    const result = await ChatSession.deleteMany({ user: req.user.id });
    res.json({ ok: 1, deleted: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
