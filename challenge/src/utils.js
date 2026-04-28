/**
 * Utilities for task processing.
 */

/**
 * Group tasks by a key function. Returns { key: [tasks] }.
 */
function groupBy(tasks, keyFn) {
  const groups = {};
  for (const task of tasks) {
    const key = keyFn(task);
    if (!groups[key]) groups[key] = [];
    groups[key].push(task);
  }
  return groups;
}

/**
 * Merge two task arrays by id. Tasks in `override` replace those in `base`.
 * Tasks only in `base` or only in `override` are included.
 */
function mergeTasks(base, override) {
  const map = new Map();
  for (const t of base) map.set(t.id, t);
  for (const t of override) map.set(t.id, t);
  return Array.from(map.values());
}

/**
 * Filter tasks by minimum priority threshold.
 */
function filterByPriority(tasks, minPriority) {
  return tasks.filter(t => (t.priority || 0) > minPriority);
}

/**
 * Sort tasks by priority descending, then by id ascending for stability.
 */
function sortTasks(tasks) {
  return [...tasks].sort((a, b) => {
    const pDiff = (b.priority || 0) - (a.priority || 0);
    if (pDiff !== 0) return pDiff;
    return String(a.id).localeCompare(String(b.id));
  });
}

/**
 * Summarize a list of tasks: count by priority level.
 * Returns { total, byPriority: { [priority]: count } }
 */
function summarize(tasks) {
  const byPriority = {};
  for (const t of tasks) {
    const p = t.priority || 0;
    byPriority[p] = (byPriority[p] || 0) + 1;
  }
  return { total: tasks.length, byPriority };
}

module.exports = { groupBy, mergeTasks, filterByPriority, sortTasks, summarize };
