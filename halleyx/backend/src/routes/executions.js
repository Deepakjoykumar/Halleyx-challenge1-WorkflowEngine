const express = require('express');
const router = express.Router();
const db = require('../models/db');

router.get('/', (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  let executions = [...db.executions].sort((a, b) => new Date(b.started_at) - new Date(a.started_at));
  if (status) executions = executions.filter(e => e.status === status);
  const total = executions.length;
  const start = (page - 1) * limit;
  const paginated = executions.slice(start, start + Number(limit));
  const enriched = paginated.map(e => {
    const workflow = db.workflows.find(w => w.id === e.workflow_id);
    return { ...e, workflow_name: workflow ? workflow.name : 'Unknown' };
  });
  res.json({ data: enriched, total, page: Number(page), limit: Number(limit) });
});

router.get('/:id', (req, res) => {
  const execution = db.executions.find(e => e.id === req.params.id);
  if (!execution) return res.status(404).json({ error: 'Execution not found' });
  const workflow = db.workflows.find(w => w.id === execution.workflow_id);
  res.json({ ...execution, workflow_name: workflow ? workflow.name : 'Unknown' });
});

router.post('/:id/cancel', (req, res) => {
  const execution = db.executions.find(e => e.id === req.params.id);
  if (!execution) return res.status(404).json({ error: 'Execution not found' });
  if (['completed', 'failed', 'canceled'].includes(execution.status))
    return res.status(400).json({ error: `Cannot cancel execution with status: ${execution.status}` });
  execution.status = 'canceled';
  execution.ended_at = new Date().toISOString();
  db.save();
  res.json(execution);
});

router.post('/:id/retry', (req, res) => {
  const execution = db.executions.find(e => e.id === req.params.id);
  if (!execution) return res.status(404).json({ error: 'Execution not found' });
  if (execution.status !== 'failed') return res.status(400).json({ error: 'Can only retry failed executions' });
  execution.status = 'in_progress';
  execution.retries += 1;
  execution.ended_at = null;
  db.save();
  res.json({ message: 'Retry initiated', execution });
});

module.exports = router;
