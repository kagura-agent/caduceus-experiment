// Task class - represents a unit of work in the queue
class Task {
  constructor(id, name, priority = 0) {
    this.id = id;
    this.name = name;
    this.priority = priority;
    this.status = 'pending';
    this.dependencies = [];
    this.result = null;
    this.createdAt = Date.now();
    this.completedAt = null;
  }

  addDependency(taskId) {
    if (taskId === this.id) {
      throw new Error('Task cannot depend on itself');
    }
    if (!this.dependencies.includes(taskId)) {
      this.dependencies.push(taskId);
    }
    return this;
  }

  removeDependency(taskId) {
    this.dependencies = this.dependencies.filter((d) => d !== taskId);
    return this;
  }

  // BUG FIX: Check that task status is 'pending' before allowing start
  start() {
    if (this.status !== 'pending') {
      throw new Error(`Cannot start task ${this.id}: status is ${this.status}`);
    }
    this.status = 'running';
    return this;
  }

  complete(result) {
    if (this.status !== 'running') {
      throw new Error(`Cannot complete task ${this.id}: not running`);
    }
    this.status = 'completed';
    this.result = result;
    this.completedAt = Date.now();
    return this;
  }

  fail(error) {
    if (this.status !== 'running') {
      throw new Error(`Cannot fail task ${this.id}: not running`);
    }
    this.status = 'failed';
    this.result = error;
    this.completedAt = Date.now();
    return this;
  }

  cancel() {
    if (this.status === 'completed' || this.status === 'failed') {
      throw new Error(`Cannot cancel task ${this.id}: already ${this.status}`);
    }
    this.status = 'cancelled';
    return this;
  }

  isReady(completedTaskIds) {
    if (this.status !== 'pending') return false;
    // BUG FIX: Check ALL dependencies are completed, not just some
    return this.dependencies.every((dep) => completedTaskIds.includes(dep));
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      priority: this.priority,
      status: this.status,
      dependencies: [...this.dependencies],
      result: this.result,
    };
  }
}

module.exports = { Task };
