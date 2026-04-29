// Scheduler - higher-level task scheduling with cycle detection and batch processing
const { TaskQueue } = require('./queue');

class Scheduler {
  constructor() {
    this.queue = new TaskQueue();
    this.maxConcurrent = 3;
    this.history = [];
  }

  addTask(id, name, priority = 0, dependencies = []) {
    const task = this.queue.add(id, name, priority);
    for (const dep of dependencies) {
      task.addDependency(dep);
    }
    return task;
  }

  // Detect if adding a dependency would create a cycle
  // Uses DFS from target back to source
  wouldCreateCycle(fromId, toId) {
    // If fromId depends on toId, check if toId (directly or indirectly) depends on fromId
    const visited = new Set();
    const stack = [toId];

    while (stack.length > 0) {
      const current = stack.pop();
      if (current === fromId) return true;
      if (visited.has(current)) continue;
      visited.add(current);

      const task = this.queue.get(current);
      if (task) {
        for (const dep of task.dependencies) {
          stack.push(dep);
        }
      }
    }
    return false;
  }

  // Safe dependency addition with cycle check
  addDependency(fromId, toId) {
    const task = this.queue.get(fromId);
    if (!task) throw new Error(`Task ${fromId} not found`);
    if (!this.queue.get(toId)) throw new Error(`Task ${toId} not found`);

    if (this.wouldCreateCycle(fromId, toId)) {
      throw new Error(`Adding dependency ${fromId} -> ${toId} would create a cycle`);
    }

    task.addDependency(toId);
    return this;
  }

  // Process tasks up to maxConcurrent, returns array of processed tasks
  async processBatch(handler) {
    const completedIds = this.queue.getCompletedIds();
    const sorted = this.queue.getSorted();
    const ready = sorted.filter((t) => t.isReady(completedIds));
    const running = this.queue.getRunning();

    // BUG FIX: Remove off-by-one error - should be exactly maxConcurrent - running.length
    const slots = this.maxConcurrent - running.length;
    if (slots <= 0) return [];

    const batch = ready.slice(0, slots);
    const results = [];

    for (const task of batch) {
      task.start();
      try {
        const result = await handler(task);
        task.complete(result);
        this.queue.processedCount++;
        this.history.push({
          taskId: task.id,
          status: 'completed',
          timestamp: Date.now(),
        });
        results.push(task);
      } catch (err) {
        task.fail(err.message);
        this.history.push({
          taskId: task.id,
          status: 'failed',
          timestamp: Date.now(),
        });
        results.push(task);
      }
    }
    return results;
  }

  // Get execution order respecting dependencies (topological sort)
  getExecutionOrder() {
    const order = [];
    const visited = new Set();
    const pending = new Set([...this.queue.tasks.keys()]);

    while (pending.size > 0) {
      let found = false;
      for (const id of pending) {
        const task = this.queue.get(id);
        const depsResolved = task.dependencies.every(
          (d) => visited.has(d) || !this.queue.tasks.has(d)
        );
        if (depsResolved) {
          order.push(id);
          visited.add(id);
          pending.delete(id);
          found = true;
          break;
        }
      }
      if (!found) {
        throw new Error('Circular dependency detected');
      }
    }
    return order;
  }

  getHistory() {
    return [...this.history];
  }

  getStats() {
    return {
      ...this.queue.stats(),
      historyLength: this.history.length,
      maxConcurrent: this.maxConcurrent,
    };
  }
}

module.exports = { Scheduler };
