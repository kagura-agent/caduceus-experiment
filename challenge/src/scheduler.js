/**
 * Scheduler - Runs tasks from a TaskQueue on an interval.
 * Supports pause/resume, max concurrent limit, and callbacks.
 */
const { TaskQueue } = require('./task-queue');

class Scheduler {
  constructor(options = {}) {
    this.queue = options.queue || new TaskQueue();
    this.maxConcurrent = options.maxConcurrent || 1;
    this.running = [];
    this.paused = true;
    this.onComplete = options.onComplete || (() => {});
    this.onError = options.onError || (() => {});
    this.stats = { completed: 0, failed: 0, totalTime: 0 };
  }

  /**
   * Schedule a task (add to queue).
   */
  schedule(task) {
    return this.queue.add(task);
  }

  /**
   * Start processing. Pulls tasks up to maxConcurrent.
   */
  start() {
    this.paused = false;
    this._fillSlots();
  }

  /**
   * Pause processing (running tasks finish, no new ones start).
   */
  pause() {
    this.paused = true;
  }

  /**
   * Execute a single task. Returns a promise.
   */
  async _execute(task) {
    const start = Date.now();
    try {
      if (typeof task.data === 'function') {
        await task.data();
      }
      const elapsed = Date.now() - start;
      this.stats.completed++;
      this.stats.totalTime += elapsed;
      this.onComplete(task, elapsed);
    } catch (err) {
      this.stats.failed++;
      this.onError(task, err);
    } finally {
      this.running = this.running.filter(t => t.id !== task.id);
      if (!this.paused) this._fillSlots();
    }
  }

  /**
   * Fill available execution slots from the queue.
   */
  _fillSlots() {
    while (this.running.length < this.maxConcurrent) {
      const task = this.queue.next();
      if (!task) break;
      this.running.push(task);
      this._execute(task);
    }
  }

  /**
   * Get current stats.
   */
  getStats() {
    return {
      ...this.stats,
      pending: this.queue.size,
      active: this.running.length,
      avgTime: this.stats.completed > 0
        ? Math.round(this.stats.totalTime / this.stats.completed)
        : 0
    };
  }
}

module.exports = { Scheduler };
