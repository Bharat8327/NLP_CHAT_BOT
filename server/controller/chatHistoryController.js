const ChatSession = require('../models/chatHistoryModel');
exports.saveSession = async (req, res) => {
  const { title, messages } = req.body;
  const sess = await ChatSession.create({ user: req.user.id, title, messages });
  res.json({ id: sess._id });
};

exports.getSessions = async (req, res) => {
  const all = await ChatSession.find({ user: req.user.id });
  res.json({ sessions: all });
};

exports.deleteSession = async (req, res) => {
  await ChatSession.deleteOne({ _id: req.params.id, user: req.user.id });
  res.json({ ok: 1 });
};

exports.deleteAll = async (req, res) => {
  await ChatSession.deleteMany({ user: req.user.id });
  res.json({ ok: 1 });
};
