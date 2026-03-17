import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

export default function ExecutionPage({ workflowId, executionId, onBack, toast }) {
  const [workflows, setWorkflows] = useState([]);
  const [selectedWfId, setSelectedWfId] = useState(workflowId || '');
  const [selectedWf, setSelectedWf] = useState(null);
  const [inputData, setInputData] = useState({});
  const [execution, setExecution] = useState(null);
  const [polling, setPolling] = useState(false);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    api.getWorkflows({ limit: 50 }).then(r => setWorkflows(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedWfId) {
      api.getWorkflow(selectedWfId).then(setSelectedWf).catch(() => {});
    }
  }, [selectedWfId]);

  useEffect(() => {
    if (executionId) {
      api.getExecution(executionId).then(setExecution).catch(() => {});
    }
  }, [executionId]);

  const pollExecution = useCallback(async (id) => {
    try {
      const exec = await api.getExecution(id);
      setExecution(exec);
      if (['in_progress', 'pending'].includes(exec.status)) {
        setTimeout(() => pollExecution(id), 800);
      } else {
        setPolling(false);
        setRunning(false);
      }
    } catch (e) { setPolling(false); setRunning(false); }
  }, []);

  const handleExecute = async () => {
    if (!selectedWfId) { toast('Select a workflow', 'error'); return; }
    setRunning(true);
    try {
      const exec = await api.executeWorkflow(selectedWfId, {
        data: inputData,
        triggered_by: 'user'
      });
      setExecution(exec);
      setPolling(true);
      setTimeout(() => pollExecution(exec.id), 400);
    } catch (e) {
      toast(e.message, 'error');
      setRunning(false);
    }
  };

  const handleCancel = async () => {
    if (!execution) return;
    try {
      const updated = await api.cancelExecution(execution.id);
      setExecution(updated);
      setPolling(false); setRunning(false);
      toast('Execution canceled', 'info');
    } catch (e) { toast(e.message, 'error'); }
  };

  const handleRetry = async () => {
    if (!execution) return;
    try {
      await api.retryExecution(execution.id);
      toast('Retry initiated', 'info');
      setTimeout(() => pollExecution(execution.id), 400);
    } catch (e) { toast(e.message, 'error'); }
  };

  const schema = selectedWf?.input_schema || {};
  const steps = selectedWf?.steps || [];

  const statusBadgeClass = (s) => ({
    completed: 'b-green', failed: 'b-red', canceled: 'b-gray', in_progress: 'b-purple', pending: 'b-gray'
  }[s] || 'b-gray');

  const getStepProgress = () => {
    if (!execution || !steps.length) return [];
    const completedStepIds = (execution.logs || []).filter(l => l.status === 'completed').map(l => l.step_id);
    const failedStepIds = (execution.logs || []).filter(l => l.status === 'failed').map(l => l.step_id);
    return steps.map(s => {
      if (completedStepIds.includes(s.id)) return { ...s, state: 'done' };
      if (failedStepIds.includes(s.id)) return { ...s, state: 'failed' };
      if (s.id === execution.current_step_id) return { ...s, state: 'active' };
      return { ...s, state: 'pending' };
    });
  };

  const chipClass = (type) => ({ task: 'sc-task', approval: 'sc-approval', notification: 'sc-notification' }[type] || 'sc-task');

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Workflow Execution</h1>
          <p>Run and monitor workflow progress in real-time</p>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        </div>
      </div>

      <div className="content">
        <div className="exec-panel">
          {/* Left: Input + Status */}
          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header">Input Data</div>
              <div style={{ padding: '14px 16px' }}>
                <div className="form-group">
                  <label className="form-label">Workflow</label>
                  <select className="form-input" value={selectedWfId} onChange={e => { setSelectedWfId(e.target.value); setInputData({}); }}>
                    <option value="">Select workflow...</option>
                    {workflows.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                {Object.entries(schema).map(([key, def]) => (
                  <div key={key} className="form-group">
                    <label className="form-label">{key} {def.required && <span style={{ color: 'var(--red)' }}>*</span>}</label>
                    {def.allowed_values
                      ? <select className="form-input" value={inputData[key] || ''} onChange={e => setInputData(d => ({ ...d, [key]: e.target.value }))}>
                          <option value="">Select...</option>
                          {def.allowed_values.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      : <input
                          type={def.type === 'number' ? 'number' : 'text'}
                          className="form-input"
                          placeholder={`${def.type}${def.required ? ', required' : ''}`}
                          value={inputData[key] || ''}
                          onChange={e => setInputData(d => ({ ...d, [key]: def.type === 'number' ? Number(e.target.value) : e.target.value }))}
                        />
                    }
                  </div>
                ))}
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleExecute} disabled={running || !selectedWfId}>
                  {running ? <><span className="spinner" /> Running…</> : '▶ Start Execution'}
                </button>
              </div>
            </div>

            <div className="card">
              <div className="card-header">Execution Status</div>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span className={`badge ${execution ? statusBadgeClass(execution.status) : 'b-gray'}`}>
                    {execution?.status || 'pending'}
                  </span>
                  <span className="mono">{execution ? execution.id.slice(0, 14) + '…' : '—'}</span>
                </div>

                {execution && (
                  <div className="progress-track">
                    {getStepProgress().map((s, i) => (
                      <div key={s.id} className={`prog-step ${s.state === 'done' ? 'done' : s.state === 'active' ? 'active-step' : s.state === 'failed' ? 'failed-step' : ''}`}>
                        <div className="prog-circle">
                          {s.state === 'done' ? '✓' : s.state === 'failed' ? '✕' : i + 1}
                        </div>
                        <div className="prog-label">{s.name}</div>
                      </div>
                    ))}
                  </div>
                )}

                {execution && (
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 12 }}>
                    <div>Started: <span style={{ color: 'var(--text)' }}>{execution.started_at?.slice(11, 19)}</span></div>
                    {execution.ended_at && <div>Ended: <span style={{ color: 'var(--text)' }}>{execution.ended_at?.slice(11, 19)}</span></div>}
                    <div>Retries: <span style={{ color: 'var(--text)' }}>{execution.retries}</span></div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-ghost btn-sm" onClick={handleCancel}
                    disabled={!execution || !['in_progress', 'pending'].includes(execution.status)}>
                    Cancel
                  </button>
                  <button className="btn btn-success btn-sm" onClick={handleRetry}
                    disabled={!execution || execution.status !== 'failed'}>
                    Retry
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Logs */}
          <div className="card">
            <div className="card-header">Execution Logs</div>
            <div style={{ padding: '14px 16px', maxHeight: 540, overflowY: 'auto' }}>
              {!execution || !execution.logs?.length
                ? <div className="empty-state" style={{ padding: '30px 10px' }}>No logs yet — start an execution</div>
                : execution.logs.map((log, i) => (
                  <div key={i} className="log-item">
                    <div className="log-header">
                      <div className={`log-status-dot ${log.status === 'completed' ? 'lsd-ok' : log.status === 'in_progress' ? 'lsd-ip' : 'lsd-fail'}`}>
                        {log.status === 'completed' ? '✓' : log.status === 'in_progress' ? '…' : '✕'}
                      </div>
                      <span style={{ fontWeight: 700, flex: 1 }}>{log.step_name}</span>
                      <span className={`step-chip ${chipClass(log.step_type)}`}>{log.step_type}</span>
                      <span className={`badge ${log.status === 'completed' ? 'b-green' : log.status === 'failed' ? 'b-red' : 'b-purple'}`} style={{ fontSize: 9 }}>{log.status}</span>
                      {log.duration_ms && <span className="mono">{log.duration_ms}ms</span>}
                    </div>

                    {log.approver_id && (
                      <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>
                        Approver: <span style={{ color: 'var(--text)' }}>{log.approver_id}</span>
                      </div>
                    )}
                    {log.selected_next_step && (
                      <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>
                        Next step: <span style={{ color: 'var(--green)', fontWeight: 700 }}>{log.selected_next_step}</span>
                      </div>
                    )}
                    {log.error_message && (
                      <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 8 }}>
                        Error: {log.error_message}
                      </div>
                    )}

                    {log.evaluated_rules?.length > 0 && (
                      <div className="rule-eval">
                        <div className="rule-eval-title">Evaluated Rules</div>
                        {log.evaluated_rules.map((r, ri) => (
                          <div key={ri} className="rule-eval-row">
                            <span className={r.result ? 're-match' : 're-skip'}>{r.result ? 'MATCH' : 'SKIP'}</span>
                            <span className="mono" style={{ color: r.result ? 'var(--text)' : 'var(--text3)', fontSize: 11 }}>
                              P{r.priority}: {r.rule}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
