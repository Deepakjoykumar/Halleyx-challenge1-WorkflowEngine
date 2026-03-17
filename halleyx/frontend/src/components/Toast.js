import React from 'react';

export default function Toast({ message, type = 'info' }) {
  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  };
  return (
    <div className={`toast ${type}`}>
      <span style={{ fontSize: 14 }}>{icons[type] || icons.info}</span>
      {message}
    </div>
  );
}
