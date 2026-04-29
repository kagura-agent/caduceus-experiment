// TaskQueue - manages a collection of tasks with priority ordering
const { Task } = require('./task');

class TaskQueue {
  constructor() {
    this.tasks = new Map();
    this.processedCount = 0;
  }

  add(id, name, priority = 0) {
    if (this.tasks.has(id)) {
      throw new Error(`Task ${id} already exists`);
    }
    const task = new Task(id, name, priority);
    this.tasks.set(id, task);
    return task;
  }

  get(id) {
    return this.tasks.get(id) || null;
  }

  remove(id) {
    const task = this.tasks.get(id);
    if (!task) return false;
    if (task.status === 'running') {
      throw new Error(`Cannot remove running task ${id}`);
    }
    // Also remove this task from other tasks' dependencies
    for (const [, other] of this.tasks) {
      other.removeDependency(id);
    }
    this.tasks.delete(id);
    return true;
  }

  size() {
    return this.tasks.size;
  }

  // Get tasks sorted by priority (higher number = higher priority)
  // BUG FIX: Use descending sort to get highest priority first
  getSorted() {
    return [...this.tasks.values()].sort((a, b) => b.priority - a.priority);
  }

  // Get the next task ready to run (highest priority pending task with all deps met)
  getNext() {
    const completedIds = this.getCompletedIds();
    const ready = this.getSorted().filter((t) => t.isReady(completedIds));
    return ready.length > 0 ? ready[0] : null;
  }

  getCompletedIds() {
    const ids = [];
    for (const [id, task] of this.tasks) {
      if (task.status === 'completed') {
        ids.push(id);
      }
    }
    return ids;
  }

  getPending() {
    return [...this.tasks.values()].filter((t) => t.status === 'pending');
  }

  getRunning() {
    return [...this.tasks.values()].filter((t) => t.status === 'running');
  }

  getCompleted() {
    return [...this.tasks.values()].filter((t) => t.status === 'completed');
  }

  getFailed() {
    return [...this.tasks.values()].filter((t) => t.status === 'failed');
  }

  // Process the next available task with the given handler
  async processNext(handler) {
    const task = this.getNext();
    if (!task) return null;

    task.start();
    try {
      const result = await handler(task);
      task.complete(result);
      this.processedCount++;
      return task;
    } catch (err) {
      task.fail(err.message);
      return task;
    }
  }

  // Get stats about the queue
  stats() {
    const all = [...this.tasks.values()];
    return {
      total: all.length,
      pending: all.filter((t) => t.status === 'pending').length,
      running: all.filter((t) => t.status === 'running').length,
      completed: all.filter((t) => t.status === 'completed').length,
      failed: all.filter((t) => t.status === 'failed').length,
      cancelled: all.filter((t) => t.status === 'cancelled').length,
      processedCount: this.processedCount,
    };
  }

  clear() {
    const running = this.getRunning();
    if (running.length > 0) {
      throw new Error('Cannot clear queue: tasks still running');
    }
    this.tasks.clear();
    // Note: processedCount is intentionally NOT reset
  }
}

module.exports = { TaskQueue };
