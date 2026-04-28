/**
 * TaskQueue - A simple priority task queue with deduplication.
 * Tasks have { id, priority, data }. Higher priority = processed first.
 */
class TaskQueue {
  constructor() {
    this.tasks = [];
    this.completed = new Set();
  }

  /**
   * Add a task. Rejects duplicates (same id) unless force=true.
   * Returns true if added, false if duplicate.
   */
  add(task, force = false) {
    if (!task || !task.id) throw new Error('Task must have an id');
    if (this.completed.has(task.id) && !force) return false;
    if (this.tasks.some(t => t.id === task.id)) {
      if (!force) return false;
      this.tasks = this.tasks.filter(t => t.id !== task.id);
    }
    const priority = task.priority || 0;
    // Insert in sorted position (descending priority)
    let inserted = false;
    for (let i = 0; i < this.tasks.length; i++) {
      if (priority >= this.tasks[i].priority) {
        this.tasks.splice(i, 0, { ...task, priority });
        inserted = true;
        break;
      }
    }
    if (!inserted) this.tasks.push({ ...task, priority });
    return true;
  }

  /**
   * Get next task (highest priority). Marks as completed.
   * Returns the task or null if empty.
   */
  next() {
    if (this.tasks.length === 0) return null;
    const task = this.tasks.shift();
    this.completed.add(task.id);
    return task;
  }

  /**
   * Peek at next task without removing it.
   */
  peek() {
    return this.tasks.length > 0 ? this.tasks[0] : null;
  }

  /**
   * Return count of pending tasks.
   */
  get size() {
    return this.tasks.length;
  }

  /**
   * Return all pending tasks as array (copy).
   */
  toArray() {
    return [...this.tasks];
  }

  /**
   * Remove all pending tasks. Does NOT clear completed set.
   */
  clear() {
    this.tasks = [];
  }

  /**
   * Reset everything including completed history.
   */
  reset() {
    this.tasks = [];
    this.completed = new Set();
  }

  /**
   * Batch add multiple tasks. Returns count of actually added.
   */
  addBatch(tasks, force = false) {
    let count = 0;
    for (const task of tasks) {
      if (this.add(task, force)) count++;
    }
    return count;
  }
}

module.exports = { TaskQueue };
