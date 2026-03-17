const { v4: uuidv4 } = require('uuid');
const db = require('../models/db');
const { evaluateRules } = require('./ruleEngine');

const MAX_LOOP_ITERATIONS = 50;

async function executeWorkflow(workflowId, inputData, triggeredBy = 'system') {
  const workflow = db.workflows.find(w => w.id === workflowId && w.is_active);
  if (!workflow) throw new Error('Workflow not found or inactive');

  const execution = {
    id: uuidv4(),
    workflow_id: workflowId,
    workflow_version: workflow.version,
    workflow_name: workflow.name,
    status: 'in_progress',
    data: inputData,
    logs: [],
    current_step_id: workflow.start_step_id,
    retries: 0,
    triggered_by: triggeredBy,
    started_at: new Date().toISOString(),
    ended_at: null
  };

  db.executions.push(execution);
  db.save();

  runExecution(execution, workflow).catch(err => {
    execution.status = 'failed';
    execution.ended_at = new Date().toISOString();
    db.save();
    console.error('Execution error:', err);
  });

  return execution;
}

async function runExecution(execution, workflow) {
  let currentStepId = execution.current_step_id;
  let iterations = 0;

  while (currentStepId && iterations < MAX_LOOP_ITERATIONS) {
    iterations++;
    const step = db.steps.find(s => s.id === currentStepId);
    if (!step) {
      execution.status = 'failed';
      execution.ended_at = new Date().toISOString();
      db.save();
      return;
    }

    const stepLog = {
      step_id: step.id,
      step_name: step.name,
      step_type: step.step_type,
      evaluated_rules: [],
      selected_next_step: null,
      status: 'in_progress',
      approver_id: execution.triggered_by,
      error_message: null,
      started_at: new Date().toISOString(),
      ended_at: null,
      duration_ms: 0
    };

    execution.logs.push(stepLog);

    try {
      const startTime = Date.now();
      await simulateStep(step);

      const rules = db.rules.filter(r => r.step_id === step.id).sort((a, b) => a.priority - b.priority);
      const { matched_rule, next_step_id, evaluations } = evaluateRules(rules, execution.data);

      stepLog.evaluated_rules = evaluations;
      stepLog.duration_ms = Date.now() - startTime;
      stepLog.ended_at = new Date().toISOString();

      if (matched_rule) {
        const nextStep = db.steps.find(s => s.id === next_step_id);
        stepLog.selected_next_step = nextStep ? nextStep.name : null;
        stepLog.status = 'completed';
        currentStepId = next_step_id;
        execution.current_step_id = next_step_id;
      } else {
        stepLog.status = 'failed';
        stepLog.error_message = 'No matching rule found and no DEFAULT rule defined';
        execution.status = 'failed';
        execution.ended_at = new Date().toISOString();
        db.save();
        return;
      }
    } catch (err) {
      stepLog.status = 'failed';
      stepLog.error_message = err.message;
      stepLog.ended_at = new Date().toISOString();
      execution.status = 'failed';
      execution.ended_at = new Date().toISOString();
      db.save();
      return;
    }
  }

  execution.status = 'completed';
  execution.current_step_id = null;
  execution.ended_at = new Date().toISOString();
  db.save();
  console.log(`  ✓ Execution ${execution.id.slice(0,8)} completed — ${execution.logs.length} steps`);
}

async function simulateStep(step) {
  const delays = { task: 100, approval: 200, notification: 50 };
  return new Promise(resolve => setTimeout(resolve, delays[step.step_type] || 100));
}

module.exports = { executeWorkflow };
