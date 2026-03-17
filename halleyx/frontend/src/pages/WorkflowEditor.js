import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

const STEP_TYPES = ['task', 'approval', 'notification'];

export default function WorkflowEditor({ workflowId, onBack, onExecute, onSelectWorkflow, toast }) {
  const [allWorkflows, setAllWorkflows] = useState([]);
  const [activeWfId, setActiveWfId] = useState(workflowId || null);
  const [workflow, setWorkflow] = useState(null);
  const [steps, setSteps] = useState([]);
  const [selectedStep, setSelectedStep] = useState(null);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStepModal, setShowStepModal] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingStep, setEditingStep] = useState(null);
  const [editingRule, setEditingRule] = useState(null);
  const [stepForm, setStepForm] = useState({ name: '', step_type: 'task', metadata: '{}' });
  const [ruleForm, setRuleForm] = useState({ condition: '', next_step_id: '', priority: 1 });

  // Load all workflows for the switcher dropdown
  useEffect(() => {
    api.getWorkflows({ limit: 50 }).then(r => {
      setAllWorkflows(r.data || []);
      if (!activeWfId && r.data?.length > 0) {
        setActiveWfId(r.data[0].id);
      }
    }).catch(() => {});
  }, [activeWfId]);

  const load = useCallback(async () => {
    if (!activeWfId) { setLoading(false); return; }
    try {
      setLoading(true);
      const wf = await api.getWorkflow(activeWfId);
      setWorkflow(wf);
      setSteps(wf.steps || []);
      setSelectedStep(null);
      setRules([]);
      if (wf.steps?.length > 0) {
        setSelectedStep(wf.steps[0]);
        setRules(wf.steps[0].rules || []);
      }
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  }, [activeWfId, toast]);

  useEffect(() => { load(); }, [load]);

  const switchWorkflow = (id) => {
    setActiveWfId(id);
    if (onSelectWorkflow) onSelectWorkflow(id);
  };

  const selectStep = (step) => {
    setSelectedStep(step);
    setRules(step.rules || []);
  };

  const loadRules = async (stepId) => {
    try {
      const r = await api.getRules(stepId);
      setRules(r);
      // Refresh step rules in steps list too
      setSteps(prev => prev.map(s => s.id === stepId ? { ...s, rules: r } : s));
    } catch (e) { toast(e.message, 'error'); }
  };

  const openAddStep = () => {
    setEditingStep(null);
    setStepForm({ name: '', step_type: 'task', metadata: '{}' });
    setShowStepModal(true);
  };

  const openEditStep = (step) => {
    setEditingStep(step);
    setStepForm({ name: step.name, step_type: step.step_type, metadata: JSON.stringify(step.metadata || {}, null, 2) });
    setShowStepModal(true);
  };

  const saveStep = async () => {
    if (!stepForm.name.trim()) { toast('Step name is required', 'error'); return; }
    let meta = {};
    try { meta = JSON.parse(stepForm.metadata); } catch { toast('Invalid metadata JSON', 'error'); return; }
    try {
      if (editingStep) {
        await api.updateStep(editingStep.id, { ...stepForm, metadata: meta });
        toast('Step updated', 'success');
      } else {
        await api.createStep(activeWfId, { ...stepForm, metadata: meta });
        toast('Step added', 'success');
      }
      setShowStepModal(false);
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const deleteStep = async (id) => {
    if (!window.confirm('Delete this step and all its rules?')) return;
    try {
      await api.deleteStep(id);
      toast('Step deleted', 'success');
      setSelectedStep(null);
      setRules([]);
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const openAddRule = () => {
    if (!selectedStep) return;
    setEditingRule(null);
    setRuleForm({ condition: '', next_step_id: '', priority: (rules.length + 1) });
    setShowRuleModal(true);
  };

  const openEditRule = (rule) => {
    setEditingRule(rule);
    setRuleForm({ condition: rule.condition, next_step_id: rule.next_step_id || '', priority: rule.priority });
    setShowRuleModal(true);
  };

  const saveRule = async () => {
    if (!ruleForm.condition.trim()) { toast('Condition is required', 'error'); return; }
    try {
      const payload = {
        condition: ruleForm.condition,
        next_step_id: ruleForm.next_step_id || null,
        priority: Number(ruleForm.priority),
      };
      if (editingRule) {
        await api.updateRule(editingRule.id, payload);
        toast('Rule updated', 'success');
      } else {
        await api.createRule(selectedStep.id, payload);
        toast('Rule added', 'success');
      }
      setShowRuleModal(false);
      await loadRules(selectedStep.id);
    } catch (e) { toast(e.message, 'error'); }
  };

  const deleteRule = async (id) => {
    try {
      await api.deleteRule(id);
      toast('Rule deleted', 'success');
      await loadRules(selectedStep.id);
    } catch (e) { toast(e.message, 'error'); }
  };

  const chipClass = (type) => ({ task: 'sc-task', approval: 'sc-approval', notification: 'sc-notification' }[type] || 'sc-task');

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
      <span className="spinner" />
    </div>
  );

  return (
    <>
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
          <div>
            <h1>Workflow Editor</h1>
            <p>{workflow ? `${workflow.name} — v${workflow.version}` : 'Select a workflow to edit'}</p>
          </div>
          {/* Workflow switcher */}
          {allWorkflows.length > 0 && (
            <select
              className="form-input"
              style={{ width: 220, marginLeft: 8 }}
              value={activeWfId || ''}
              onChange={e => switchWorkflow(e.target.value)}
            >
              {allWorkflows.map(w => (
                <option key={w.id} value={w.id}>{w.name} (v{w.version})</option>
              ))}
            </select>
          )}
        </div>
        <div className="topbar-actions">
          <button className="btn btn-ghost" onClick={onBack}>← Back</button>
          {workflow && (
            <button className="btn btn-success" onClick={() => onExecute(activeWfId)}>▶ Execute</button>
          )}
        </div>
      </div>

      <div className="content">
        {/* Workflow info strip */}
        {workflow && (
          <div className="card" style={{ marginBottom: 18, padding: '12px 18px' }}>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
              <div>
                <div className="form-label" style={{ marginBottom: 3 }}>Version</div>
                <span className="badge b-purple">v{workflow.version}</span>
              </div>
              <div>
                <div className="form-label" style={{ marginBottom: 3 }}>Status</div>
                <span className={`badge ${workflow.is_active ? 'b-green' : 'b-gray'}`}>
                  {workflow.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <div className="form-label" style={{ marginBottom: 3 }}>Input Schema</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {Object.entries(workflow.input_schema || {}).map(([key, val]) => (
                    <span key={key} className="mono" style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', padding: '3px 9px', borderRadius: 20, fontSize: 11 }}>
                      {key}: {val.type}{val.required ? ' *' : ''}{val.allowed_values ? ` [${val.allowed_values.join('|')}]` : ''}
                    </span>
                  ))}
                  {Object.keys(workflow.input_schema || {}).length === 0 && (
                    <span className="muted">No schema defined</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="editor-grid">
          {/* Steps Panel */}
          <div className="card">
            <div className="card-header">
              Steps
              {workflow && (
                <button className="btn btn-primary btn-sm" onClick={openAddStep}>+ Add Step</button>
              )}
            </div>
            <div>
              {!workflow ? (
                <div className="empty-state" style={{ padding: '30px 20px' }}>Select a workflow above</div>
              ) : steps.length === 0 ? (
                <div className="empty-state" style={{ padding: '30px 20px' }}>
                  <h3>No steps yet</h3>
                  <p>Add your first step to get started</p>
                </div>
              ) : steps.map(step => (
                <div
                  key={step.id}
                  className={`step-list-item${selectedStep?.id === step.id ? ' selected' : ''}`}
                  onClick={() => selectStep(step)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="step-num">{step.order}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{step.name}</div>
                      <div style={{ marginTop: 4, display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span className={`step-chip ${chipClass(step.step_type)}`}>{step.step_type}</span>
                        {step.metadata?.assignee_email && (
                          <span className="muted" style={{ fontSize: 10 }}>{step.metadata.assignee_email}</span>
                        )}
                        <span className="mono" style={{ marginLeft: 'auto' }}>
                          {(step.rules || []).length} rule{(step.rules || []).length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-xs" onClick={e => { e.stopPropagation(); openEditStep(step); }}>✎</button>
                      <button className="btn btn-danger btn-xs" onClick={e => { e.stopPropagation(); deleteStep(step.id); }}>✕</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rules Panel */}
          <div className="card">
            <div className="card-header">
              {selectedStep ? `Rules — ${selectedStep.name}` : 'Rules'}
              {selectedStep && (
                <button className="btn btn-primary btn-sm" onClick={openAddRule}>+ Add Rule</button>
              )}
            </div>
            <div style={{ padding: '14px 16px' }}>
              {!selectedStep ? (
                <div className="empty-state" style={{ padding: '30px 10px' }}>
                  <h3>No step selected</h3>
                  <p>Click a step on the left to view and edit its rules</p>
                </div>
              ) : rules.length === 0 ? (
                <div className="empty-state" style={{ padding: '30px 10px' }}>
                  <h3>No rules yet</h3>
                  <p>Add at least one DEFAULT rule to route to the next step</p>
                </div>
              ) : [...rules].sort((a, b) => a.priority - b.priority).map(rule => {
                const nextStep = steps.find(s => s.id === rule.next_step_id);
                return (
                  <div key={rule.id} className="rule-row">
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span className="prio-badge">P{rule.priority}</span>
                      <span
                        className={`rule-cond${rule.condition === 'DEFAULT' ? ' default-rule' : ''}`}
                        style={{ flex: 1, wordBreak: 'break-word' }}
                      >
                        {rule.condition}
                      </span>
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        <button className="btn btn-ghost btn-xs" onClick={() => openEditRule(rule)}>✎</button>
                        <button className="btn btn-danger btn-xs" onClick={() => deleteRule(rule.id)}>✕</button>
                      </div>
                    </div>
                    <div className="next-step-label">
                      → {nextStep
                        ? <span style={{ color: 'var(--green)', fontWeight: 700 }}>{nextStep.name}</span>
                        : rule.next_step_id
                          ? <span className="muted">{rule.next_step_id}</span>
                          : <span style={{ color: 'var(--text3)' }}>End of workflow</span>
                      }
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Step Modal */}
      {showStepModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowStepModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editingStep ? 'Edit Step' : 'Add Step'}</h3>
              <button className="close-btn" onClick={() => setShowStepModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Step Name *</label>
                <input className="form-input" value={stepForm.name}
                  onChange={e => setStepForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Manager Approval" />
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-input" value={stepForm.step_type}
                  onChange={e => setStepForm(f => ({ ...f, step_type: e.target.value }))}>
                  {STEP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Metadata (JSON)</label>
                <textarea className="form-input" rows={4} value={stepForm.metadata}
                  onChange={e => setStepForm(f => ({ ...f, metadata: e.target.value }))}
                  placeholder='{"assignee_email": "manager@example.com"}' />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowStepModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={saveStep}>Save Step</button>
            </div>
          </div>
        </div>
      )}

      {/* Rule Modal */}
      {showRuleModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowRuleModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editingRule ? 'Edit Rule' : 'Add Rule'}</h3>
              <button className="close-btn" onClick={() => setShowRuleModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Condition *</label>
                <textarea className="form-input" rows={3} value={ruleForm.condition}
                  onChange={e => setRuleForm(f => ({ ...f, condition: e.target.value }))}
                  placeholder="e.g. amount > 100 && country == 'US'" />
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>
                  Operators: ==, !=, &lt;, &gt;, &lt;=, &gt;=, &amp;&amp;, ||, contains(), startsWith(), endsWith(), DEFAULT
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Next Step</label>
                <select className="form-input" value={ruleForm.next_step_id}
                  onChange={e => setRuleForm(f => ({ ...f, next_step_id: e.target.value }))}>
                  <option value="">End of workflow</option>
                  {steps.filter(s => s.id !== selectedStep?.id).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <input type="number" className="form-input" min={1} value={ruleForm.priority}
                  onChange={e => setRuleForm(f => ({ ...f, priority: e.target.value }))}
                  style={{ width: 100 }} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowRuleModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={saveRule}>Save Rule</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
