// ─── In-memory mock DB (used when backend is unavailable) ───────────────────
import { v4 as uuidv4 } from './uuid';

const now = () => new Date().toISOString();

const STEP1 = uuidv4(), STEP2 = uuidv4(), STEP3 = uuidv4(), STEP4 = uuidv4();
const STEP5 = uuidv4(), STEP6 = uuidv4();
const WF1   = uuidv4(), WF2   = uuidv4();
const EXEC1 = uuidv4(), EXEC2 = uuidv4(), EXEC3 = uuidv4();

const store = {
  workflows: [
    {
      id: WF1, name: 'Expense Approval',
      description: 'Multi-level expense approval with finance and CEO sign-off',
      version: 3, is_active: true,
      input_schema: {
        amount:     { type: 'number',  required: true },
        country:    { type: 'string',  required: true },
        department: { type: 'string',  required: false },
        priority:   { type: 'string',  required: true, allowed_values: ['High','Medium','Low'] },
      },
      start_step_id: STEP1,
      created_at: '2026-01-10T08:00:00Z', updated_at: '2026-03-01T10:00:00Z',
    },
    {
      id: WF2, name: 'Employee Onboarding',
      description: 'New hire onboarding process with notifications and tasks',
      version: 1, is_active: true,
      input_schema: {
        employee_name: { type: 'string', required: true },
        department:    { type: 'string', required: true },
        start_date:    { type: 'string', required: true },
      },
      start_step_id: STEP5,
      created_at: '2026-02-01T09:00:00Z', updated_at: '2026-02-01T09:00:00Z',
    },
  ],
  steps: [
    { id: STEP1, workflow_id: WF1, name: 'Manager Approval',    step_type: 'approval',     order: 1, metadata: { assignee_email: 'manager@example.com', instructions: 'Review and approve expense' }, created_at: now(), updated_at: now() },
    { id: STEP2, workflow_id: WF1, name: 'Finance Notification',step_type: 'notification', order: 2, metadata: { notification_channel: 'email', template: 'expense_approved' }, created_at: now(), updated_at: now() },
    { id: STEP3, workflow_id: WF1, name: 'CEO Approval',        step_type: 'approval',     order: 3, metadata: { assignee_email: 'ceo@example.com' }, created_at: now(), updated_at: now() },
    { id: STEP4, workflow_id: WF1, name: 'Task Rejection',      step_type: 'task',         order: 4, metadata: { action: 'reject_expense' }, created_at: now(), updated_at: now() },
    { id: STEP5, workflow_id: WF2, name: 'Send Welcome Email',  step_type: 'notification', order: 1, metadata: { notification_channel: 'email', template: 'welcome_onboard' }, created_at: now(), updated_at: now() },
    { id: STEP6, workflow_id: WF2, name: 'Setup IT Access',     step_type: 'task',         order: 2, metadata: { action: 'provision_accounts' }, created_at: now(), updated_at: now() },
  ],
  rules: [
    { id: uuidv4(), step_id: STEP1, priority: 1, condition: "amount > 100 && country == 'US' && priority == 'High'", next_step_id: STEP2, created_at: now(), updated_at: now() },
    { id: uuidv4(), step_id: STEP1, priority: 2, condition: "amount <= 100 || department == 'HR'",                   next_step_id: STEP3, created_at: now(), updated_at: now() },
    { id: uuidv4(), step_id: STEP1, priority: 3, condition: "priority == 'Low' && country != 'US'",                  next_step_id: STEP4, created_at: now(), updated_at: now() },
    { id: uuidv4(), step_id: STEP1, priority: 4, condition: 'DEFAULT',                                               next_step_id: STEP4, created_at: now(), updated_at: now() },
    { id: uuidv4(), step_id: STEP2, priority: 1, condition: 'DEFAULT', next_step_id: STEP3, created_at: now(), updated_at: now() },
    { id: uuidv4(), step_id: STEP3, priority: 1, condition: 'DEFAULT', next_step_id: null,  created_at: now(), updated_at: now() },
    { id: uuidv4(), step_id: STEP4, priority: 1, condition: 'DEFAULT', next_step_id: null,  created_at: now(), updated_at: now() },
    { id: uuidv4(), step_id: STEP5, priority: 1, condition: 'DEFAULT', next_step_id: STEP6, created_at: now(), updated_at: now() },
    { id: uuidv4(), step_id: STEP6, priority: 1, condition: 'DEFAULT', next_step_id: null,  created_at: now(), updated_at: now() },
  ],
  executions: [
    {
      id: EXEC1, workflow_id: WF1, workflow_version: 3, workflow_name: 'Expense Approval',
      status: 'completed', triggered_by: 'user123', retries: 0,
      data: { amount: 250, country: 'US', department: 'Finance', priority: 'High' },
      current_step_id: null,
      started_at: '2026-03-16T10:00:00Z', ended_at: '2026-03-16T10:00:03Z',
      logs: [
        { step_id: STEP1, step_name: 'Manager Approval', step_type: 'approval', status: 'completed', approver_id: 'user123', error_message: null, selected_next_step: 'Finance Notification', duration_ms: 312, started_at: '2026-03-16T10:00:00Z', ended_at: '2026-03-16T10:00:00.312Z', evaluated_rules: [{ priority:1, rule: "amount > 100 && country == 'US' && priority == 'High'", result: true },{ priority:2, rule: "amount <= 100 || department == 'HR'", result: false }] },
        { step_id: STEP2, step_name: 'Finance Notification', step_type: 'notification', status: 'completed', approver_id: null, error_message: null, selected_next_step: 'CEO Approval', duration_ms: 289, started_at: '2026-03-16T10:00:01Z', ended_at: '2026-03-16T10:00:01.289Z', evaluated_rules: [{ priority:1, rule: 'DEFAULT', result: true }] },
        { step_id: STEP3, step_name: 'CEO Approval', step_type: 'approval', status: 'completed', approver_id: 'user123', error_message: null, selected_next_step: null, duration_ms: 1200, started_at: '2026-03-16T10:00:02Z', ended_at: '2026-03-16T10:00:03.2Z', evaluated_rules: [{ priority:1, rule: 'DEFAULT', result: true }] },
      ],
    },
    {
      id: EXEC2, workflow_id: WF2, workflow_version: 1, workflow_name: 'Employee Onboarding',
      status: 'completed', triggered_by: 'user456', retries: 0,
      data: { employee_name: 'Jane Smith', department: 'Engineering', start_date: '2026-03-20' },
      current_step_id: null,
      started_at: '2026-03-16T09:45:12Z', ended_at: '2026-03-16T09:45:14Z',
      logs: [
        { step_id: STEP5, step_name: 'Send Welcome Email', step_type: 'notification', status: 'completed', approver_id: null, error_message: null, selected_next_step: 'Setup IT Access', duration_ms: 500, started_at: '2026-03-16T09:45:12Z', ended_at: '2026-03-16T09:45:12.5Z', evaluated_rules: [{ priority:1, rule: 'DEFAULT', result: true }] },
        { step_id: STEP6, step_name: 'Setup IT Access', step_type: 'task', status: 'completed', approver_id: null, error_message: null, selected_next_step: null, duration_ms: 1300, started_at: '2026-03-16T09:45:13Z', ended_at: '2026-03-16T09:45:14.3Z', evaluated_rules: [{ priority:1, rule: 'DEFAULT', result: true }] },
      ],
    },
    {
      id: EXEC3, workflow_id: WF1, workflow_version: 3, workflow_name: 'Expense Approval',
      status: 'failed', triggered_by: 'user123', retries: 0,
      data: { amount: 50, country: 'UK', department: 'Engineering', priority: 'Low' },
      current_step_id: STEP1,
      started_at: '2026-03-16T09:30:00Z', ended_at: '2026-03-16T09:30:01Z',
      logs: [
        { step_id: STEP1, step_name: 'Manager Approval', step_type: 'approval', status: 'failed', approver_id: null, error_message: 'Approval timed out', selected_next_step: null, duration_ms: 900, started_at: '2026-03-16T09:30:00Z', ended_at: '2026-03-16T09:30:00.9Z', evaluated_rules: [{ priority:1, rule: "amount > 100 && country == 'US' && priority == 'High'", result: false },{ priority:2, rule: "amount <= 100 || department == 'HR'", result: true }] },
      ],
    },
  ],
};

// ─── Rule Engine ─────────────────────────────────────────────────────────────
function evalCondition(condition, data) {
  if (!condition || condition.trim().toUpperCase() === 'DEFAULT') return true;
  try {
    let expr = condition
      .replace(/contains\((\w+),\s*["']([^"']+)["']\)/g, (_, f, v) => String(data[f] || '').includes(v) ? 'true' : 'false')
      .replace(/startsWith\((\w+),\s*["']([^"']+)["']\)/g, (_, f, v) => String(data[f] || '').startsWith(v) ? 'true' : 'false')
      .replace(/endsWith\((\w+),\s*["']([^"']+)["']\)/g, (_, f, v) => String(data[f] || '').endsWith(v) ? 'true' : 'false');
    Object.keys(data).forEach(k => {
      const val = data[k];
      expr = expr.replace(new RegExp(`\\b${k}\\b`, 'g'), typeof val === 'string' ? `"${val}"` : String(val ?? 'null'));
    });
    // eslint-disable-next-line no-new-func
    return Boolean(new Function(`return (${expr})`)());
  } catch { return false; }
}

async function simulateExecution(execId) {
  const exec = store.executions.find(e => e.id === execId);
  if (!exec) return;
  let currentStepId = store.workflows.find(w => w.id === exec.workflow_id)?.start_step_id;
  exec.logs = [];
  let iters = 0;
  while (currentStepId && iters++ < 50) {
    const step = store.steps.find(s => s.id === currentStepId);
    if (!step) { exec.status = 'failed'; break; }
    exec.current_step_id = currentStepId;
    const rules = store.rules.filter(r => r.step_id === step.id).sort((a,b) => a.priority - b.priority);
    const evals = rules.map(r => ({ priority: r.priority, rule: r.condition, result: evalCondition(r.condition, exec.data) }));
    const matched = rules.find((r, i) => evals[i].result);
    const delay = step.step_type === 'approval' ? 600 : step.step_type === 'notification' ? 200 : 300;
    await new Promise(res => setTimeout(res, delay));
    const nextStep = matched ? store.steps.find(s => s.id === matched.next_step_id) : null;
    exec.logs.push({
      step_id: step.id, step_name: step.name, step_type: step.step_type,
      status: matched ? 'completed' : 'failed',
      approver_id: step.step_type === 'approval' ? exec.triggered_by : null,
      error_message: matched ? null : 'No matching rule found',
      selected_next_step: nextStep?.name || null,
      duration_ms: delay, started_at: now(), ended_at: now(),
      evaluated_rules: evals,
    });
    if (!matched) { exec.status = 'failed'; exec.ended_at = now(); return; }
    currentStepId = matched.next_step_id;
  }
  exec.status = 'completed'; exec.current_step_id = null; exec.ended_at = now();
}

// ─── Simulate async network delay ────────────────────────────────────────────
const delay = (ms = 120) => new Promise(r => setTimeout(r, ms));

// ─── API Methods ─────────────────────────────────────────────────────────────
export const api = {
  // Workflows
  getWorkflows: async (params = {}) => {
    await delay();
    let wfs = store.workflows.map(w => ({ ...w, steps_count: store.steps.filter(s => s.workflow_id === w.id).length }));
    if (params.search) wfs = wfs.filter(w => w.name.toLowerCase().includes(params.search.toLowerCase()));
    if (params.status === 'active') wfs = wfs.filter(w => w.is_active);
    if (params.status === 'inactive') wfs = wfs.filter(w => !w.is_active);
    return { data: wfs, total: wfs.length, page: 1, limit: 20 };
  },

  getWorkflow: async (id) => {
    await delay();
    const wf = store.workflows.find(w => w.id === id);
    if (!wf) throw new Error('Workflow not found');
    const steps = store.steps.filter(s => s.workflow_id === id).sort((a,b) => a.order - b.order)
      .map(s => ({ ...s, rules: store.rules.filter(r => r.step_id === s.id).sort((a,b) => a.priority - b.priority) }));
    return { ...wf, steps };
  },

  createWorkflow: async (data) => {
    await delay();
    const wf = { id: uuidv4(), version: 1, is_active: true, start_step_id: null, created_at: now(), updated_at: now(), ...data };
    store.workflows.push(wf);
    return wf;
  },

  updateWorkflow: async (id, data) => {
    await delay();
    const idx = store.workflows.findIndex(w => w.id === id);
    if (idx === -1) throw new Error('Workflow not found');
    store.workflows[idx] = { ...store.workflows[idx], ...data, id, version: store.workflows[idx].version + 1, updated_at: now() };
    return store.workflows[idx];
  },

  deleteWorkflow: async (id) => {
    await delay();
    const stepIds = store.steps.filter(s => s.workflow_id === id).map(s => s.id);
    store.workflows = store.workflows.filter(w => w.id !== id);
    store.steps = store.steps.filter(s => s.workflow_id !== id);
    store.rules = store.rules.filter(r => !stepIds.includes(r.step_id));
    return { message: 'Deleted' };
  },

  executeWorkflow: async (id, payload) => {
    await delay();
    const wf = store.workflows.find(w => w.id === id);
    if (!wf) throw new Error('Workflow not found');
    const exec = {
      id: uuidv4(), workflow_id: id, workflow_version: wf.version, workflow_name: wf.name,
      status: 'in_progress', data: payload.data || {}, logs: [],
      current_step_id: wf.start_step_id, retries: 0,
      triggered_by: payload.triggered_by || 'user',
      started_at: now(), ended_at: null,
    };
    store.executions.unshift(exec);
    simulateExecution(exec.id); // async, no await
    return exec;
  },

  // Steps
  getSteps: async (workflowId) => {
    await delay();
    return store.steps.filter(s => s.workflow_id === workflowId).sort((a,b) => a.order - b.order);
  },

  createStep: async (workflowId, data) => {
    await delay();
    const order = store.steps.filter(s => s.workflow_id === workflowId).length + 1;
    const step = { id: uuidv4(), workflow_id: workflowId, order, created_at: now(), updated_at: now(), ...data };
    store.steps.push(step);
    const wf = store.workflows.find(w => w.id === workflowId);
    if (wf && !wf.start_step_id) { wf.start_step_id = step.id; wf.updated_at = now(); }
    return step;
  },

  updateStep: async (id, data) => {
    await delay();
    const idx = store.steps.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('Step not found');
    store.steps[idx] = { ...store.steps[idx], ...data, id, updated_at: now() };
    return store.steps[idx];
  },

  deleteStep: async (id) => {
    await delay();
    store.steps = store.steps.filter(s => s.id !== id);
    store.rules = store.rules.filter(r => r.step_id !== id);
    return { message: 'Deleted' };
  },

  // Rules
  getRules: async (stepId) => {
    await delay();
    return store.rules.filter(r => r.step_id === stepId).sort((a,b) => a.priority - b.priority);
  },

  createRule: async (stepId, data) => {
    await delay();
    const rule = { id: uuidv4(), step_id: stepId, created_at: now(), updated_at: now(), ...data };
    store.rules.push(rule);
    return rule;
  },

  updateRule: async (id, data) => {
    await delay();
    const idx = store.rules.findIndex(r => r.id === id);
    if (idx === -1) throw new Error('Rule not found');
    store.rules[idx] = { ...store.rules[idx], ...data, id, updated_at: now() };
    return store.rules[idx];
  },

  deleteRule: async (id) => {
    await delay();
    store.rules = store.rules.filter(r => r.id !== id);
    return { message: 'Deleted' };
  },

  // Executions
  getExecutions: async (params = {}) => {
    await delay();
    let execs = [...store.executions].sort((a,b) => new Date(b.started_at) - new Date(a.started_at));
    if (params.status) execs = execs.filter(e => e.status === params.status);
    const limit = Number(params.limit) || 50;
    return { data: execs.slice(0, limit), total: execs.length, page: 1, limit };
  },

  getExecution: async (id) => {
    await delay();
    const exec = store.executions.find(e => e.id === id);
    if (!exec) throw new Error('Execution not found');
    return exec;
  },

  cancelExecution: async (id) => {
    await delay();
    const exec = store.executions.find(e => e.id === id);
    if (!exec) throw new Error('Not found');
    if (['completed','failed','canceled'].includes(exec.status)) throw new Error(`Cannot cancel: ${exec.status}`);
    exec.status = 'canceled'; exec.ended_at = now();
    return exec;
  },

  retryExecution: async (id) => {
    await delay();
    const exec = store.executions.find(e => e.id === id);
    if (!exec) throw new Error('Not found');
    if (exec.status !== 'failed') throw new Error('Can only retry failed executions');
    exec.status = 'in_progress'; exec.retries += 1; exec.ended_at = null;
    simulateExecution(exec.id);
    return { message: 'Retry started', execution: exec };
  },
};
