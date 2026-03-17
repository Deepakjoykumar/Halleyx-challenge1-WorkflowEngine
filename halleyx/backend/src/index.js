const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const workflowRoutes = require('./routes/workflows');
const stepRoutes = require('./routes/steps');
const ruleRoutes = require('./routes/rules');
const executionRoutes = require('./routes/executions');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/workflows', workflowRoutes);
app.use('/steps', stepRoutes);
app.use('/rules', ruleRoutes);
app.use('/executions', executionRoutes);

// ── Root — API homepage ───────────────────────────────────────────────────────
app.get('/', (req, res) => {
  const db = require('./models/db');
  const PORT = process.env.PORT || 4000;
  res.send(`<!DOCTYPE html><html><head><title>Halleyx API</title>
  <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,sans-serif;background:#0d0f14;color:#e8eaf0;padding:30px;line-height:1.6}
  h1{font-size:22px;font-weight:800;margin-bottom:4px}h1 span{color:#8b84ff}
  .sub{color:#8b90a0;font-size:13px;margin-bottom:24px}
  .status{display:inline-flex;align-items:center;gap:8px;background:rgba(34,211,160,.1);color:#22d3a0;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:700;margin-bottom:28px}
  .dot{width:7px;height:7px;border-radius:50%;background:#22d3a0;animation:p 1.5s infinite}@keyframes p{0%,100%{opacity:1}50%{opacity:.3}}
  .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:28px}
  .stat{background:#13161e;border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:14px 16px}
  .sl{font-size:10px;color:#555a6b;text-transform:uppercase;letter-spacing:.8px;font-weight:700;margin-bottom:4px}
  .sv{font-size:26px;font-weight:800}
  h2{font-size:11px;font-weight:700;color:#555a6b;text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px}
  .ep{display:flex;align-items:center;gap:10px;padding:8px 12px;background:#13161e;border-radius:7px;margin-bottom:6px;font-size:12px;border:1px solid rgba(255,255,255,.05)}
  .m{font-weight:700;font-size:10px;padding:2px 7px;border-radius:4px;flex-shrink:0;font-family:monospace}
  .get{background:rgba(68,170,255,.15);color:#44aaff}.post{background:rgba(34,211,160,.15);color:#22d3a0}
  .put{background:rgba(240,160,68,.15);color:#f0a044}.del{background:rgba(240,85,102,.15);color:#f05566}
  .path{font-family:monospace;color:#e8eaf0}.desc{color:#8b90a0;margin-left:auto;font-size:11px}
  a{color:#8b84ff;text-decoration:none}.note{margin-top:24px;padding:14px 16px;background:rgba(108,99,255,.1);border-radius:8px;font-size:13px;color:#8b84ff;border:1px solid rgba(108,99,255,.2)}
  .db-path{margin-top:12px;font-family:monospace;font-size:11px;color:#555a6b}
  </style></head><body>
  <h1>Halley<span>x</span> Workflow Engine</h1>
  <div class="sub">REST API — Backend Server</div>
  <div class="status"><span class="dot"></span> Running on port ${PORT}</div>
  <div class="grid">
    <div class="stat"><div class="sl">Workflows</div><div class="sv" style="color:#8b84ff">${db.workflows.length}</div></div>
    <div class="stat"><div class="sl">Steps</div><div class="sv" style="color:#44aaff">${db.steps.length}</div></div>
    <div class="stat"><div class="sl">Rules</div><div class="sv" style="color:#f0a044">${db.rules.length}</div></div>
    <div class="stat"><div class="sl">Executions</div><div class="sv" style="color:#22d3a0">${db.executions.length}</div></div>
  </div>
  <h2>API Endpoints</h2>
  <div class="ep"><span class="m get">GET</span><span class="path">/workflows</span><span class="desc">List all workflows</span></div>
  <div class="ep"><span class="m post">POST</span><span class="path">/workflows</span><span class="desc">Create workflow</span></div>
  <div class="ep"><span class="m get">GET</span><span class="path">/workflows/:id</span><span class="desc">Get workflow + steps + rules</span></div>
  <div class="ep"><span class="m put">PUT</span><span class="path">/workflows/:id</span><span class="desc">Update workflow</span></div>
  <div class="ep"><span class="m del">DEL</span><span class="path">/workflows/:id</span><span class="desc">Delete workflow</span></div>
  <div class="ep"><span class="m post">POST</span><span class="path">/workflows/:id/execute</span><span class="desc">Execute workflow</span></div>
  <div class="ep"><span class="m post">POST</span><span class="path">/workflows/:id/steps</span><span class="desc">Add step</span></div>
  <div class="ep"><span class="m post">POST</span><span class="path">/steps/:id/rules</span><span class="desc">Add rule</span></div>
  <div class="ep"><span class="m get">GET</span><span class="path">/executions</span><span class="desc">List all executions</span></div>
  <div class="ep"><span class="m get">GET</span><span class="path">/executions/:id</span><span class="desc">Get execution + logs</span></div>
  <div class="ep"><span class="m get">GET</span><span class="path">/db</span><span class="desc" style="color:#22d3a0">View entire database (debug)</span></div>
  <div class="ep"><span class="m get">GET</span><span class="path">/health</span><span class="desc">Health check</span></div>
  <div class="note">Frontend UI → <a href="http://localhost:3000" target="_blank">http://localhost:3000</a><br>
  View database → <a href="http://localhost:${PORT}/db" target="_blank">http://localhost:${PORT}/db</a></div>
  <div class="db-path">db.json saved at: ${path.join(__dirname, '../db.json')}</div>
  </body></html>`);
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  const db = require('./models/db');
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    data: { workflows: db.workflows.length, steps: db.steps.length, rules: db.rules.length, executions: db.executions.length }
  });
});

// ── DB viewer — see everything stored ────────────────────────────────────────
app.get('/db', (req, res) => {
  const db = require('./models/db');
  const { table } = req.query;
  const DB_FILE = path.join(__dirname, '../db.json');
  const fileExists = fs.existsSync(DB_FILE);
  const fileSize = fileExists ? (fs.statSync(DB_FILE).size / 1024).toFixed(1) + ' KB' : 'N/A';

  if (table && db[table]) {
    return res.json({ table, count: db[table].length, data: db[table] });
  }

  res.send(`<!DOCTYPE html><html><head><title>Halleyx DB Viewer</title>
  <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,sans-serif;background:#0d0f14;color:#e8eaf0;padding:24px}
  h1{font-size:18px;font-weight:800;margin-bottom:4px}h1 span{color:#8b84ff}
  .sub{color:#8b90a0;font-size:12px;margin-bottom:20px}
  .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:24px}
  .stat{background:#13161e;border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:14px 16px;cursor:pointer;transition:border-color .15s;text-decoration:none;display:block}
  .stat:hover{border-color:rgba(108,99,255,.4)}
  .sl{font-size:10px;color:#555a6b;text-transform:uppercase;letter-spacing:.8px;font-weight:700;margin-bottom:4px}
  .sv{font-size:28px;font-weight:800}
  .section{margin-bottom:24px}
  h2{font-size:12px;font-weight:700;color:#555a6b;text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px}
  .json-box{background:#13161e;border:1px solid rgba(255,255,255,.07);border-radius:8px;padding:16px;overflow-x:auto;max-height:400px;overflow-y:auto}
  pre{font-family:'JetBrains Mono',monospace;font-size:11px;line-height:1.6;white-space:pre-wrap;word-break:break-all}
  .key{color:#8b84ff}.str{color:#22d3a0}.num{color:#f0a044}.bool{color:#44aaff}.null{color:#f05566}
  .meta{font-size:11px;color:#555a6b;margin-bottom:16px;font-family:monospace}
  a{color:#8b84ff}.tabs{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap}
  .tab{padding:6px 14px;border-radius:20px;font-size:12px;font-weight:700;cursor:pointer;border:1px solid rgba(255,255,255,.1);color:#8b90a0;text-decoration:none}
  .tab:hover{background:#1a1e28}.tab.active{background:rgba(108,99,255,.15);color:#8b84ff;border-color:rgba(108,99,255,.3)}
  </style></head><body>
  <h1>Halley<span>x</span> DB Viewer</h1>
  <div class="sub">Live view of db.json • File: ${fileExists?'✓ exists':'✗ missing'} • Size: ${fileSize}</div>
  <div class="grid">
    <a class="stat" href="/db?table=workflows"><div class="sl">Workflows</div><div class="sv" style="color:#8b84ff">${db.workflows.length}</div></a>
    <a class="stat" href="/db?table=steps"><div class="sl">Steps</div><div class="sv" style="color:#44aaff">${db.steps.length}</div></a>
    <a class="stat" href="/db?table=rules"><div class="sl">Rules</div><div class="sv" style="color:#f0a044">${db.rules.length}</div></a>
    <a class="stat" href="/db?table=executions"><div class="sl">Executions</div><div class="sv" style="color:#22d3a0">${db.executions.length}</div></a>
  </div>
  <div class="tabs">
    <a class="tab active" href="/db">All</a>
    <a class="tab" href="/db?table=workflows">Workflows</a>
    <a class="tab" href="/db?table=steps">Steps</a>
    <a class="tab" href="/db?table=rules">Rules</a>
    <a class="tab" href="/db?table=executions">Executions</a>
  </div>
  ${['workflows','steps','rules','executions'].map(t => `
  <div class="section">
    <h2>${t} (${db[t].length})</h2>
    <div class="json-box"><pre>${syntaxHighlight(JSON.stringify(db[t], null, 2))}</pre></div>
  </div>`).join('')}
  <script>
  function syntaxHighlight(j){return j;}
  </script>
  </body></html>`);
});

function syntaxHighlight(json) {
  return json
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, match => {
      let cls = 'num';
      if (/^"/.test(match)) cls = /:$/.test(match) ? 'key' : 'str';
      else if (/true|false/.test(match)) cls = 'bool';
      else if (/null/.test(match)) cls = 'null';
      return `<span class="${cls}">${match}</span>`;
    });
}

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  
  
  console.log(`  ║  API-backend →  http://localhost:${PORT}`);
  console.log(`  ║  Frontend    →  http://localhost:3000 `);
  console.log(`  ║  DB View     →  http://localhost:${PORT}/db`);
  console.log(`  ║  health      →  http://localhost:${PORT}/health `);
  
});
