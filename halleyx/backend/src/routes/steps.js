const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../models/db');

router.put('/:id', (req, res) => {
  const idx = db.steps.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Step not found' });
  db.steps[idx] = { ...db.steps[idx], ...req.body, id: req.params.id, updated_at: new Date().toISOString() };
  db.save();
  res.json(db.steps[idx]);
});

router.delete('/:id', (req, res) => {
  const idx = db.steps.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Step not found' });
  const stepId = req.params.id;
  db.steps.splice(idx, 1);
  db.rules = db.rules.filter(r => r.step_id !== stepId);
  db.save();
  res.json({ message: 'Step deleted' });
});

router.get('/:step_id/rules', (req, res) => {
  res.json(db.rules.filter(r => r.step_id === req.params.step_id).sort((a, b) => a.priority - b.priority));
});

router.post('/:step_id/rules', (req, res) => {
  const step = db.steps.find(s => s.id === req.params.step_id);
  if (!step) return res.status(404).json({ error: 'Step not found' });
  const { condition, next_step_id, priority } = req.body;
  if (!condition) return res.status(400).json({ error: 'condition is required' });
  const rule = { id: uuidv4(), step_id: req.params.step_id, condition,
    next_step_id: next_step_id || null,
    priority: priority || db.rules.filter(r => r.step_id === req.params.step_id).length + 1,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  db.rules.push(rule);
  db.save();
  res.status(201).json(rule);
});

module.exports = router;
