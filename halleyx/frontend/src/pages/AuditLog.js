import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

export default function AuditLog({ onViewExecution, toast }) {
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [stats, setStats] = useState({ total: 0, completed: 0, failed: 0, canceled: 0 });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.getExecutions(params);
      const data = res.data || [];
      setExecutions(data);
      const all = await api.getExecutions({ limit: 200 });
      const allData = all.data || [];
      setStats({
        total: allData.length,
        completed: allData.filter(e => e.status === 'completed').length,
        failed: allData.filter(e => e.status === 'failed').length,
        canceled: allData.filter(e => e.status === 'canceled').length,
      });
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  }, [statusFilter, toast]);

  useEffect(() => { load(); }, [load]);

  const statusClass = (s) => ({ completed: 'b-green', failed: 'b-red', canceled: 'b-gray', in_progress: 'b-purple', pending: 'b-gray' }[s] || 'b-gray');

  const duration = (exec) => {
    if (!exec.started_at || !exec.ended_at) return '—';
    const ms = new Date(exec.ended_at) - new Date(exec.started_at);
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Audit Log</h1>
          <p>All workflow executions — full history</p>
        </div>
        <div className="topbar-actions">
          <select className="form-input" style={{ width: 'auto' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="canceled">Canceled</option>
            <option value="in_progress">In Progress</option>
          </select>
          <button className="btn btn-ghost btn-sm" onClick={load}>↻ Refresh</button>
        </div>
      </div>

      <div className="content">
        <div className="stat-grid">
          <div className="stat-card"><div className="stat-label">Total Executions</div><div className="stat-val stat-purple">{stats.total}</div></div>
          <div className="stat-card"><div className="stat-label">Completed</div><div className="stat-val stat-green">{stats.completed}</div></div>
          <div className="stat-card"><div className="stat-label">Failed</div><div className="stat-val stat-red">{stats.failed}</div></div>
          <div className="stat-card"><div className="stat-label">Canceled</div><div className="stat-val stat-orange">{stats.canceled}</div></div>
        </div>

        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Execution ID</th><th>Workflow</th><th>Version</th><th>Status</th>
                <th>Started By</th><th>Start Time</th><th>Duration</th><th>Steps</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40 }}><span className="spinner" /></td></tr>
              ) : executions.length === 0 ? (
                <tr><td colSpan={9}><div className="empty-state">No executions found</div></td></tr>
              ) : executions.map(exec => (
                <tr key={exec.id}>
                  <td><span className="mono">{exec.id.slice(0, 14)}…</span></td>
                  <td><span style={{ fontWeight: 700 }}>{exec.workflow_name}</span></td>
                  <td><span className="badge b-purple">v{exec.workflow_version}</span></td>
                  <td><span className={`badge ${statusClass(exec.status)}`}>{exec.status.toUpperCase()}</span></td>
                  <td><span style={{ fontSize: 13 }}>{exec.triggered_by}</span></td>
                  <td><span className="muted">{exec.started_at?.slice(0, 19).replace('T', ' ')}</span></td>
                  <td><span className="mono">{duration(exec)}</span></td>
                  <td><span style={{ fontWeight: 700 }}>{exec.logs?.length ?? 0}</span></td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => onViewExecution(exec.workflow_id, exec.id)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
