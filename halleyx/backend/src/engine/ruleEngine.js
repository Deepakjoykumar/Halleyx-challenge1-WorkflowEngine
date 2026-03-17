/**
 * Rule Engine - evaluates conditions against input data
 * Supports: ==, !=, <, >, <=, >=, &&, ||, contains(), startsWith(), endsWith()
 */

function evaluateCondition(condition, data) {
  if (!condition || condition.trim().toUpperCase() === 'DEFAULT') {
    return { result: true, isDefault: true };
  }

  try {
    // Build evaluation context
    const contextKeys = Object.keys(data);
    const contextValues = contextKeys.map(k => {
      const v = data[k];
      return typeof v === 'string' ? `"${v}"` : v;
    });

    // Replace function-style operators
    let expr = condition
      .replace(/contains\((\w+),\s*["']([^"']+)["']\)/g, (_, field, value) => {
        const fieldVal = data[field];
        return fieldVal && String(fieldVal).includes(value) ? 'true' : 'false';
      })
      .replace(/startsWith\((\w+),\s*["']([^"']+)["']\)/g, (_, field, value) => {
        const fieldVal = data[field];
        return fieldVal && String(fieldVal).startsWith(value) ? 'true' : 'false';
      })
      .replace(/endsWith\((\w+),\s*["']([^"']+)["']\)/g, (_, field, value) => {
        const fieldVal = data[field];
        return fieldVal && String(fieldVal).endsWith(value) ? 'true' : 'false';
      });

    // Replace field references with actual values
    contextKeys.forEach(key => {
      const val = data[key];
      const replacement = typeof val === 'string' ? `"${val}"` : String(val ?? 'null');
      expr = expr.replace(new RegExp(`\\b${key}\\b`, 'g'), replacement);
    });

    // Safe evaluation using Function constructor
    const result = new Function(`return (${expr})`)();
    return { result: Boolean(result), isDefault: false };
  } catch (err) {
    return { result: false, isDefault: false, error: err.message };
  }
}

function evaluateRules(rules, data) {
  const sortedRules = [...rules].sort((a, b) => a.priority - b.priority);
  const evaluations = [];

  for (const rule of sortedRules) {
    const { result, isDefault, error } = evaluateCondition(rule.condition, data);
    evaluations.push({
      rule_id: rule.id,
      rule: rule.condition,
      priority: rule.priority,
      result,
      isDefault: isDefault || false,
      error: error || null
    });

    if (result) {
      return { matched_rule: rule, next_step_id: rule.next_step_id, evaluations };
    }
  }

  return { matched_rule: null, next_step_id: null, evaluations };
}

module.exports = { evaluateRules, evaluateCondition };
