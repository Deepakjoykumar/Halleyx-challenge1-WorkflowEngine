import React, { useState } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import LoginPage from './pages/LoginPage';
import WorkflowList from './pages/WorkflowList';
import WorkflowEditor from './pages/WorkflowEditor';
import ExecutionPage from './pages/ExecutionPage';
import AuditLog from './pages/AuditLog';
import Toast from './components/Toast';
import { api } from './utils/api';

function AppContent() {
  const { isDark, toggleTheme } = useTheme();
  const [user, setUser] = useState(null); 
  const [page, setPage] = useState('workflows');
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(null);
  const [selectedExecutionId, setSelectedExecutionId] = useState(null);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  };

  const handleLogin = (userData) => {
    setUser(userData);
    addToast(`Welcome back, ${userData.name}!`, 'success');
  };

  const handleLogout = () => {
    setUser(null);
    setPage('workflows');
    setSelectedWorkflowId(null);
    setSelectedExecutionId(null);
  };

  const navigate = (p, wfId = null, execId = null) => {
    setPage(p);
    if (wfId !== null) setSelectedWorkflowId(wfId);
    if (execId !== null) setSelectedExecutionId(execId);
  };

  const handleNavEditor = async () => {
    if (selectedWorkflowId) { navigate('editor'); return; }
    try {
      const res = await api.getWorkflows({ limit: 1 });
      const first = res.data?.[0];
      if (first) navigate('editor', first.id);
      else { addToast('Create a workflow first', 'info'); navigate('workflows'); }
    } catch { navigate('workflows'); }
  };

  const handleNavExecution = async () => {
    if (selectedWorkflowId) { navigate('execution'); return; }
    try {
      const res = await api.getWorkflows({ limit: 1 });
      const first = res.data?.[0];
      if (first) navigate('execution', first.id);
      else { addToast('Create a workflow first', 'info'); navigate('workflows'); }
    } catch { navigate('workflows'); }
  };

  if (!user) {
    return (
      <>
        <LoginPage onLogin={handleLogin} />
        <div className="toast-container">
          {toasts.map(t => <Toast key={t.id} message={t.message} type={t.type} />)}
        </div>
      </>
    );
  }

  const navItems = [
    { id: 'workflows', label: 'Workflows',        icon: <WorkflowsIcon />,  onClick: () => navigate('workflows') },
    { id: 'editor',   label: 'Workflow Editor',   icon: <EditorIcon />,     onClick: handleNavEditor },
    { id: 'execution',label: 'Execute',            icon: <ExecuteIcon />,    onClick: handleNavExecution },
    { id: 'audit',    label: 'Audit Log',          icon: <AuditIcon />,      onClick: () => navigate('audit') },
  ];

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-title">HALLEY<span>X</span></div>
          <div className="logo-sub">workflow engine</div>
        </div>

        <nav className="nav">
          {navItems.map(item => (
            <div
              key={item.id}
              className={`nav-item${page === item.id ? ' active' : ''}`}
              onClick={item.onClick}
            >
              {item.icon}
              {item.label}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          
          <div style={{
            display: 'flex', alignItems: 'center', gap: 9,
            padding: '9px 12px', marginBottom: 4,
            background: 'var(--bg3)', borderRadius: 8,
            border: '1px solid var(--border)',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--accent-muted)', border: '1px solid var(--border2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: 'var(--accent)', flexShrink: 0,
            }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                {user.email}
              </div>
            </div>
          </div>

          <button className="theme-toggle" onClick={toggleTheme}>
            {isDark ? <SunIcon /> : <MoonIcon />}
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </button>

          <button
            className="theme-toggle"
            onClick={handleLogout}
            style={{ color: 'var(--red)', marginTop: 2 }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h3M9 10l3-3-3-3M12 7H5"/>
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      <main className="main">
        {page === 'workflows' && (
          <WorkflowList
            onEdit={(id) => navigate('editor', id)}
            onExecute={(id) => navigate('execution', id)}
            onViewExecution={(id) => navigate('execution', null, id)}
            toast={addToast}
          />
        )}
        {page === 'editor' && (
          <WorkflowEditor
            workflowId={selectedWorkflowId}
            onBack={() => navigate('workflows')}
            onExecute={(id) => navigate('execution', id)}
            onSelectWorkflow={(id) => setSelectedWorkflowId(id)}
            toast={addToast}
          />
        )}
        {page === 'execution' && (
          <ExecutionPage
            workflowId={selectedWorkflowId}
            executionId={selectedExecutionId}
            onBack={() => navigate('workflows')}
            toast={addToast}
          />
        )}
        {page === 'audit' && (
          <AuditLog
            onViewExecution={(wfId, execId) => navigate('execution', wfId, execId)}
            toast={addToast}
          />
        )}
      </main>

      <div className="toast-container">
        {toasts.map(t => <Toast key={t.id} message={t.message} type={t.type} />)}
      </div>
    </div>
  );
}

function WorkflowsIcon() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="1" y="1.5" width="13" height="3" rx="1"/><rect x="1" y="6.5" width="9" height="3" rx="1"/><rect x="1" y="11.5" width="11" height="2.5" rx="1"/></svg>;
}
function EditorIcon() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M2 11L4.5 8.5l7-7 1.5 1.5-7 7L2 11z"/><path d="M9 3l3 3"/></svg>;
}
function ExecuteIcon() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="7.5" cy="7.5" r="6"/><polygon points="6,5 11,7.5 6,10" fill="currentColor" stroke="none"/></svg>;
}
function AuditIcon() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="1.5" y="1.5" width="12" height="12" rx="1.5"/><path d="M4.5 7.5h6M4.5 10h4M4.5 5h6"/></svg>;
}
function SunIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="3"/><path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.93 2.93l1.06 1.06M9.01 9.01l1.06 1.06M11.07 2.93l-1.06 1.06M4.99 9.01L3.93 10.07"/></svg>;
}
function MoonIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11.5 8.5A5 5 0 015.5 2.5a5 5 0 000 9 5 5 0 006-3z"/></svg>;
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
