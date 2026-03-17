const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../models/db');
const { executeWorkflow } = require('../engine/workflowEngine');

// GET /workflows
router.get('/', (req, res) => {
  const { search, page = 1, limit = 20, status } = req.query;
  let workflows = [...db.workflows];
  if (search) workflows = workflows.filter(w => w.name.toLowerCase().includes(search.toLowerCase()));
  if (status === 'active') workflows = workflows.filter(w => w.is_active);
  if (status === 'inactive') workflows = workflows.filter(w => !w.is_active);
  const total = workflows.length;
  const start = (page - 1) * limit;
  const paginated = workflows.slice(start, start + Number(limit));
  const enriched = paginated.map(w => ({ ...w, steps_count: db.steps.filter(s => s.workflow_id === w.id).length }));
  res.json({ data: enriched, total, page: Number(page), limit: Number(limit) });
});

// GET /workflows/:id
router.get('/:id', (req, res) => {
  const workflow = db.workflows.find(w => w.id === req.params.id);
  if (!workflow) return res.status(404).json({ error: 'Workflow not found' });
  const steps = db.steps.filter(s => s.workflow_id === workflow.id).sort((a, b) => a.order - b.order);
  const stepsWithRules = steps.map(step => ({ ...step, rules: db.rules.filter(r => r.step_id === step.id).sort((a, b) => a.priority - b.priority) }));
  res.json({ ...workflow, steps: stepsWithRules });
});

// POST /workflows
router.post('/', (req, res) => {
  const { name, description, input_schema } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const workflow = { id: uuidv4(), name, description: description || '', version: 1, is_active: true,
    input_schema: input_schema || {}, start_step_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  db.workflows.push(workflow);
  db.save();
  res.status(201).json(workflow);
});

// PUT /workflows/:id
router.put('/:id', (req, res) => {
  const idx = db.workflows.findIndex(w => w.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Workflow not found' });
  db.workflows[idx] = { ...db.workflows[idx], ...req.body, id: req.params.id, version: db.workflows[idx].version + 1, updated_at: new Date().toISOString() };
  db.save();
  res.json(db.workflows[idx]);
});

// DELETE /workflows/:id
router.delete('/:id', (req, res) => {
  const idx = db.workflows.findIndex(w => w.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Workflow not found' });
  const stepIds = db.steps.filter(s => s.workflow_id === req.params.id).map(s => s.id);
  db.workflows.splice(idx, 1);
  db.steps = db.steps.filter(s => s.workflow_id !== req.params.id);
  db.rules = db.rules.filter(r => !stepIds.includes(r.step_id));
  db.save();
  res.json({ message: 'Workflow deleted' });
});

// POST /workflows/:id/execute
router.post('/:workflow_id/execute', async (req, res) => {
  try {
    const execution = await executeWorkflow(req.params.workflow_id, req.body.data || {}, req.body.triggered_by || 'user');
    res.status(201).json(execution);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /workflows/:workflow_id/steps
router.get('/:workflow_id/steps', (req, res) => {
  const steps = db.steps.filter(s => s.workflow_id === req.params.workflow_id).sort((a, b) => a.order - b.order);
  res.json(steps);
});

// POST /workflows/:workflow_id/steps
router.post('/:workflow_id/steps', (req, res) => {
  const workflow = db.workflows.find(w => w.id === req.params.workflow_id);
  if (!workflow) return res.status(404).json({ error: 'Workflow not found' });
  const { name, step_type, order, metadata } = req.body;
  if (!name || !step_type) return res.status(400).json({ error: 'name and step_type are required' });
  const step = { id: uuidv4(), workflow_id: req.params.workflow_id, name, step_type,
    order: order || db.steps.filter(s => s.workflow_id === req.params.workflow_id).length + 1,
    metadata: metadata || {}, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  db.steps.push(step);
  if (!workflow.start_step_id) { workflow.start_step_id = step.id; workflow.updated_at = new Date().toISOString(); }
  db.save();
  res.status(201).json(step);
});

module.exports = router;
