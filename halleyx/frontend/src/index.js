import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Set default theme
document.documentElement.setAttribute('data-theme', 'dark');

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
