# Halleyx Workflow Engine

A full-stack workflow automation system — design workflows, define rules, execute processes, and track every step.

## Tech Stack

- **Backend**: Node.js + Express (in-memory store, no DB required)
- **Frontend**: React 18 (dark + light mode, responsive)
- **Rule Engine**: Custom evaluator supporting `==`, `!=`, `<`, `>`, `<=`, `>=`, `&&`, `||`, `contains()`, `startsWith()`, `endsWith()`, `DEFAULT`

---

## Quick Start

### 1. Backend

```bash
cd backend
npm install
npm start
# Runs on http://localhost:4000
```

For development with auto-reload:
```bash
npm run dev
```

### 2. Frontend

```bash
cd frontend
npm install
npm start
# Runs on http://localhost:3000
```

> The frontend proxies API calls to `http://localhost:4000` automatically.

---

## API Reference

### Workflows
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/workflows` | List (supports `?search=`, `?status=active\|inactive`, `?page=`, `?limit=`) |
| POST | `/workflows` | Create workflow |
| GET | `/workflows/:id` | Get with steps & rules |
| PUT | `/workflows/:id` | Update (bumps version) |
| DELETE | `/workflows/:id` | Delete (cascades to steps/rules) |
| POST | `/workflows/:id/execute` | Start execution |
| GET | `/workflows/:id/steps` | List steps |
| POST | `/workflows/:id/steps` | Add step |

### Steps
| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | `/steps/:id` | Update step |
| DELETE | `/steps/:id` | Delete step |
| GET | `/steps/:id/rules` | List rules |
| POST | `/steps/:id/rules` | Add rule |

### Rules
| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | `/rules/:id` | Update rule |
| DELETE | `/rules/:id` | Delete rule |

### Executions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/executions` | List all (supports `?status=`, `?page=`, `?limit=`) |
| GET | `/executions/:id` | Get execution with logs |
| POST | `/executions/:id/cancel` | Cancel execution |
| POST | `/executions/:id/retry` | Retry failed step |

---

## Sample Workflow: Expense Approval

**Input Schema:**
```json
{
  "amount": { "type": "number", "required": true },
  "country": { "type": "string", "required": true },
  "department": { "type": "string", "required": false },
  "priority": { "type": "string", "required": true, "allowed_values": ["High", "Medium", "Low"] }
}
```

**Steps & Rules:**

1. **Manager Approval** (approval)
   - P1: `amount > 100 && country == 'US' && priority == 'High'` → Finance Notification
   - P2: `amount <= 100 || department == 'HR'` → CEO Approval
   - P3: `priority == 'Low' && country != 'US'` → Task Rejection
   - P4: `DEFAULT` → Task Rejection

2. **Finance Notification** (notification) → CEO Approval
3. **CEO Approval** (approval) → End
4. **Task Rejection** (task) → End

**Sample Execution Input:**
```json
{
  "amount": 250,
  "country": "US",
  "department": "Finance",
  "priority": "High"
}
```

**Expected Path:** Manager Approval → Finance Notification → CEO Approval ✓

---

## Rule Engine

Rules are evaluated in priority order (lowest = first). The first matching rule determines the next step.

**Supported operators:**
- Comparison: `==`, `!=`, `<`, `>`, `<=`, `>=`
- Logical: `&&` (AND), `||` (OR)
- String functions: `contains(field, "value")`, `startsWith(field, "prefix")`, `endsWith(field, "suffix")`
- `DEFAULT` — catches all unmatched cases (required)

**Step Log Example:**
```json
{
  "step_name": "Manager Approval",
  "step_type": "approval",
  "evaluated_rules": [
    { "rule": "amount > 100 && country == 'US' && priority == 'High'", "result": true }
  ],
  "selected_next_step": "Finance Notification",
  "status": "completed",
  "approver_id": "user-001",
  "duration_ms": 312
}
```

---

## UI Features

- **Workflows List** — search, filter by status, create/edit/execute/delete
- **Workflow Editor** — manage steps (add/edit/delete), define rules with drag-friendly priority
- **Execution Page** — live progress tracker, step-by-step logs, rule evaluation trace
- **Audit Log** — execution history, stats, filter by status
- **Dark / Light Mode** — toggle via sidebar button

---

## Project Structure

```
halleyx/
├── backend/
│   └── src/
│       ├── index.js           # Express app entry
│       ├── models/db.js       # In-memory store + seed data
│       ├── engine/
│       │   ├── ruleEngine.js  # Rule evaluation logic
│       │   └── workflowEngine.js # Execution orchestrator
│       └── routes/
│           ├── workflows.js
│           ├── steps.js
│           ├── rules.js
│           └── executions.js
└── frontend/
    └── src/
        ├── App.js             # Root component + navigation
        ├── index.css          # Global styles + CSS variables
        ├── context/
        │   └── ThemeContext.js
        ├── utils/api.js       # API client
        ├── components/
        │   └── Toast.js
        └── pages/
            ├── WorkflowList.js
            ├── WorkflowEditor.js
            ├── ExecutionPage.js
            └── AuditLog.js
```
