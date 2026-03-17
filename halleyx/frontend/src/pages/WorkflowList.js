import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

export default function WorkflowList({ onEdit, onExecute, toast }) {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', input_schema: '{}' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await api.getWorkflows(params);
      setWorkflows(res.data || []);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, toast]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this workflow?')) return;
    try {
      await api.deleteWorkflow(id);
      toast('Workflow deleted', 'success');
      load();
    } catch (e) { toast(e.message, 'error'); }
  };

  const handleCreate = async () => {
    if (!form.name.trim()) { toast('Name is required', 'error'); return; }
    let schema = {};
    try { schema = JSON.parse(form.input_schema); } catch { toast('Invalid JSON schema', 'error'); return; }
    setSaving(true);
    try {
      await api.createWorkflow({ name: form.name, description: form.description, input_schema: schema });
      toast('Workflow created!', 'success');
      setShowModal(false);
      setForm({ name: '', description: '', input_schema: '{}' });
      load();
    } catch (e) { toast(e.message, 'error'); } finally { setSaving(false); }
  };

  const statusBadge = (active) => active
    ? <span className="badge b-green">Active</span>
    : <span className="badge b-gray">Inactive</span>;

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Workflows</h1>
          <p>Manage and execute your automation workflows</p>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 1v10M1 6h10"/></svg>
            New Workflow
          </button>
        </div>
      </div>

      <div className="content">
        <div className="toolbar">
          <div className="search-wrap">
            <span className="search-icon">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6" cy="6" r="4"/><path d="M10 10l2.5 2.5"/></svg>
            </span>
            <input
              type="text"
              placeholder="Search workflows..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="form-input"
              style={{ paddingLeft: 34, width: 220 }}
            />
          </div>
          <select className="form-input" style={{ width: 'auto' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="card">
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Name</th><th>Steps</th><th>Version</th><th>Status</th><th>Created</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>
                  <span className="spinner" />
                </td></tr>
              ) : workflows.length === 0 ? (
                <tr><td colSpan={7}>
                  <div className="empty-state">
                    <h3>No workflows found</h3>
                    <p>Create your first workflow to get started</p>
                  </div>
                </td></tr>
              ) : workflows.map(wf => (
                <tr key={wf.id}>
                  <td><span className="mono">{wf.id.slice(0, 8)}…</span></td>
                  <td>
                    <span style={{ fontWeight: 700 }}>{wf.name}</span>
                    {wf.description && <div className="muted" style={{ marginTop: 2 }}>{wf.description}</div>}
                  </td>
                  <td><span style={{ fontWeight: 700 }}>{wf.steps_count ?? 0}</span></td>
                  <td><span className="badge b-purple">v{wf.version}</span></td>
                  <td>{statusBadge(wf.is_active)}</td>
                  <td><span className="muted">{wf.created_at?.slice(0, 10)}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => onEdit(wf.id)}>Edit</button>
                      <button className="btn btn-success btn-sm" onClick={() => onExecute(wf.id)}>▶ Execute</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(wf.id)}>✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>New Workflow</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Workflow Name *</label>
                <input className="form-input" placeholder="e.g. Expense Approval" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-input" placeholder="Brief description..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Input Schema (JSON)</label>
                <textarea className="form-input" rows={5} value={form.input_schema} onChange={e => setForm(f => ({ ...f, input_schema: e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleCreate} disabled={saving}>
                {saving ? <span className="spinner" /> : 'Create Workflow'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
