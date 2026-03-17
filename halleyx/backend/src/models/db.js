const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '../../db.json');

// ── Load or initialize ────────────────────────────────────────────────────────
function loadDb() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(raw);
    } catch (e) {
      console.warn('db.json corrupted, re-seeding...');
    }
  }
  return null;
}

function saveDb() {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

// ── Auto-save on every mutation (debounced 300ms) ─────────────────────────────
let saveTimer = null;
function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(saveDb, 300);
}

// ── Proxy: intercept array mutations and auto-save ────────────────────────────
function watchArray(arr) {
  return new Proxy(arr, {
    set(target, prop, value) {
      target[prop] = value;
      if (prop !== 'length') scheduleSave();
      return true;
    }
  });
}

// ── Seed sample data ──────────────────────────────────────────────────────────
function seed() {
  const wf1Id = uuidv4(), wf2Id = uuidv4();
  const s1=uuidv4(),s2=uuidv4(),s3=uuidv4(),s4=uuidv4(),s5=uuidv4(),s6=uuidv4();

  db.workflows.push(
    { id:wf1Id, name:'Expense Approval', description:'Multi-level expense approval with finance and CEO sign-off',
      version:3, is_active:true,
      input_schema:{ amount:{type:'number',required:true}, country:{type:'string',required:true},
        department:{type:'string',required:false}, priority:{type:'string',required:true,allowed_values:['High','Medium','Low']} },
      start_step_id:s1, created_at:'2026-01-10T08:00:00Z', updated_at:'2026-03-01T10:00:00Z' },
    { id:wf2Id, name:'Employee Onboarding', description:'New hire onboarding process',
      version:1, is_active:true,
      input_schema:{ employee_name:{type:'string',required:true}, department:{type:'string',required:true}, start_date:{type:'string',required:true} },
      start_step_id:s5, created_at:'2026-02-01T09:00:00Z', updated_at:'2026-02-01T09:00:00Z' }
  );
  db.steps.push(
    {id:s1,workflow_id:wf1Id,name:'Manager Approval',step_type:'approval',order:1,metadata:{assignee_email:'manager@example.com'},created_at:new Date().toISOString(),updated_at:new Date().toISOString()},
    {id:s2,workflow_id:wf1Id,name:'Finance Notification',step_type:'notification',order:2,metadata:{notification_channel:'email'},created_at:new Date().toISOString(),updated_at:new Date().toISOString()},
    {id:s3,workflow_id:wf1Id,name:'CEO Approval',step_type:'approval',order:3,metadata:{assignee_email:'ceo@example.com'},created_at:new Date().toISOString(),updated_at:new Date().toISOString()},
    {id:s4,workflow_id:wf1Id,name:'Task Rejection',step_type:'task',order:4,metadata:{action:'reject_expense'},created_at:new Date().toISOString(),updated_at:new Date().toISOString()},
    {id:s5,workflow_id:wf2Id,name:'Send Welcome Email',step_type:'notification',order:1,metadata:{notification_channel:'email'},created_at:new Date().toISOString(),updated_at:new Date().toISOString()},
    {id:s6,workflow_id:wf2Id,name:'Setup IT Access',step_type:'task',order:2,metadata:{action:'provision_accounts'},created_at:new Date().toISOString(),updated_at:new Date().toISOString()}
  );
  db.rules.push(
    {id:uuidv4(),step_id:s1,priority:1,condition:"amount > 100 && country == 'US' && priority == 'High'",next_step_id:s2,created_at:new Date().toISOString(),updated_at:new Date().toISOString()},
    {id:uuidv4(),step_id:s1,priority:2,condition:"amount <= 100 || department == 'HR'",next_step_id:s3,created_at:new Date().toISOString(),updated_at:new Date().toISOString()},
    {id:uuidv4(),step_id:s1,priority:3,condition:"priority == 'Low' && country != 'US'",next_step_id:s4,created_at:new Date().toISOString(),updated_at:new Date().toISOString()},
    {id:uuidv4(),step_id:s1,priority:4,condition:'DEFAULT',next_step_id:s4,created_at:new Date().toISOString(),updated_at:new Date().toISOString()},
    {id:uuidv4(),step_id:s2,priority:1,condition:'DEFAULT',next_step_id:s3,created_at:new Date().toISOString(),updated_at:new Date().toISOString()},
    {id:uuidv4(),step_id:s3,priority:1,condition:'DEFAULT',next_step_id:null,created_at:new Date().toISOString(),updated_at:new Date().toISOString()},
    {id:uuidv4(),step_id:s4,priority:1,condition:'DEFAULT',next_step_id:null,created_at:new Date().toISOString(),updated_at:new Date().toISOString()},
    {id:uuidv4(),step_id:s5,priority:1,condition:'DEFAULT',next_step_id:s6,created_at:new Date().toISOString(),updated_at:new Date().toISOString()},
    {id:uuidv4(),step_id:s6,priority:1,condition:'DEFAULT',next_step_id:null,created_at:new Date().toISOString(),updated_at:new Date().toISOString()}
  );
  saveDb();
  console.log('  ✓ Seeded sample data → db.json');
}

// ── Initialize db ─────────────────────────────────────────────────────────────
const loaded = loadDb();
const db = {
  workflows: loaded ? loaded.workflows : [],
  steps:     loaded ? loaded.steps     : [],
  rules:     loaded ? loaded.rules     : [],
  executions:loaded ? loaded.executions: [],
};

if (!loaded) {
  console.log('  ✦ No db.json found — creating with seed data...');
  seed();
} else {
  console.log(`  ✓ Loaded db.json — ${db.workflows.length} workflows, ${db.executions.length} executions`);
}

// ── Export with auto-save on mutations ────────────────────────────────────────
module.exports = db;
module.exports.save = saveDb;
module.exports.scheduleSave = scheduleSave;
