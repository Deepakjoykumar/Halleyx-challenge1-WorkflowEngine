const express = require('express');
const router = express.Router();
const db = require('../models/db');

router.put('/:id', (req, res) => {
  const idx = db.rules.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Rule not found' });
  db.rules[idx] = { ...db.rules[idx], ...req.body, id: req.params.id, updated_at: new Date().toISOString() };
  db.save();
  res.json(db.rules[idx]);
});

router.delete('/:id', (req, res) => {
  const idx = db.rules.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Rule not found' });
  db.rules.splice(idx, 1);
  db.save();
  res.json({ message: 'Rule deleted' });
});

module.exports = router;
