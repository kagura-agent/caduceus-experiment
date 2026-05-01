// TaskQueue - Priority task scheduler with dependencies, retries, and timeouts
// WARNING: This implementation has 8 bugs. Find and fix them all!

class TaskQueue {
  constructor() {
    this._tasks = new Map();      // id -> { fn, options, status, result, error, attempts }
    this._order = [];              // insertion order tracking
    this._results = new Map();    // id -> { status, result, error, attempts }
  }

  // Add a task to the queue
  // Returns the task id
  add(fn, options = {}) {
    const id = options.id || `task-${this._tasks.size}`;
    const task = {
      fn,
      id,
      priority: options.priority || 0,          // BUG 1: || vs ?? (priority 0 becomes default)
      retries: options.retries ?? 0,
      timeout: options.timeout ?? null,
      dependencies: options.dependencies || [],
      status: 'pending',
      result: null,
      error: null,
      attempts: 0,
    };
    this._tasks.set(id, task);
    this._order.push(id);
    return id;
  }

  // Run all tasks respecting priority and dependencies
  async run() {
    const completed = new Set();
    const failed = new Set();

    // Sort by priority (highest first), stable by insertion order
    const sorted = [...this._order].sort((a, b) => {
      const taskA = this._tasks.get(a);
      const taskB = this._tasks.get(b);
      return taskA.priority - taskB.priority;    // BUG 2: should be descending (b - a)
    });

    // Process tasks in order
    for (const id of sorted) {
      const task = this._tasks.get(id);

      // Check dependencies
      const depsOk = task.dependencies.every(dep => completed.has(dep));
      if (!depsOk) {
        // Check if any dependency failed
        const depFailed = task.dependencies.some(dep => failed.has(dep));
        if (depFailed) {
          task.status = 'failed';
          task.error = new Error(`Dependency failed`);
          this._results.set(id, this._snapshot(task));
          failed.add(id);
          continue;
        }
        // Dependency not yet completed — skip for now, we'll retry
        task.status = 'blocked';
        task.error = new Error('Unresolved dependency');
        this._results.set(id, this._snapshot(task));
        failed.add(id);
        continue;
      }

      // Execute the task
      await this._execute(task);

      if (task.status === 'completed') {
        completed.add(id);
      } else {
        failed.add(id);
      }
    }
  }

  // Execute a single task with retries and timeout
  async _execute(task) {
    let lastError = null;

    // BUG 3: should be <= retries (attempt 0 is first try, then retry up to N times)
    for (let attempt = 0; attempt < task.retries; attempt++) {
      task.attempts++;

      try {
        let result;
        if (task.timeout) {
          result = await this._withTimeout(task.fn(), task.timeout);
        } else {
          result = await task.fn();
        }

        task.status = 'completed';
        task.result = result;
        task.error = null;
        this._results.set(task.id, this._snapshot(task));
        return;
      } catch (err) {
        lastError = err;
      }
    }

    // All attempts exhausted
    task.status = 'failed';
    task.error = lastError;
    this._results.set(task.id, this._snapshot(task));
  }

  // Wrap a promise with a timeout
  _withTimeout(promise, ms) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Task timed out'));
      }, ms);

      promise.then(
        (val) => {
          clearTimeout(timer);
          resolve(val);              // BUG 4 is elsewhere, this is fine
        },
        (err) => {
          // BUG 4: forgot to clearTimeout on rejection
          reject(err);
        }
      );
    });
  }

  // Get result for a specific task
  getResult(id) {
    if (!this._results.has(id)) {
      return null;
    }
    return this._results.get(id);
  }

  // Get overall stats
  getStats() {
    let completed = 0;
    let failed = 0;
    let pending = 0;

    for (const [id, task] of this._tasks) {
      switch (task.status) {
        case 'completed':
          completed++;
          break;
        case 'failed':
        case 'blocked':
          failed++;
          break;
        default:
          pending++;              // BUG 5: 'pending' status counted but never updated
      }
    }

    return {
      total: this._tasks.size,
      completed,
      failed,
      pending: this._tasks.size - completed  // BUG 6: should be just `pending` variable, this double-counts failed as pending
    };
  }

  // Create a snapshot of task state
  _snapshot(task) {
    return {
      status: task.status,
      result: task.result,
      error: task.error,
      attempts: task.attempts,
      id: task.id                // BUG 7: id shouldn't be in the snapshot (test checks exact shape)
    };
  }

  // Check if a task exists
  has(id) {
    return this._tasks.has(id);
  }

  // Get all task IDs in priority order
  getOrder() {
    return [...this._order].sort((a, b) => {
      const taskA = this._tasks.get(a);
      const taskB = this._tasks.get(b);
      if (taskA.priority !== taskB.priority) {
        return taskB.priority - taskA.priority;
      }
      return this._order.indexOf(a) - this._order.indexOf(b);
    });
  }

  // Reset the queue
  reset() {
    this._tasks.clear();
    this._results.clear();
    // BUG 8: forgot to clear this._order
  }
}

module.exports = { TaskQueue };
