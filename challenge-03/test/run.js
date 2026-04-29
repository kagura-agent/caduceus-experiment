// Test runner for Challenge 03: Bug Hunt
// These tests are CORRECT - do not modify them!

const { Task } = require('../src/task');
const { TaskQueue } = require('../src/queue');
const { Scheduler } = require('../src/scheduler');

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.log(`  ✗ ${message}`);
    failed++;
    failures.push(message);
  }
}

function assertThrows(fn, message) {
  try {
    fn();
    console.log(`  ✗ ${message} (no error thrown)`);
    failed++;
    failures.push(message);
  } catch (e) {
    console.log(`  ✓ ${message}`);
    passed++;
  }
}

async function assertAsync(asyncFn, message) {
  try {
    const result = await asyncFn();
    if (result) {
      console.log(`  ✓ ${message}`);
      passed++;
    } else {
      console.log(`  ✗ ${message}`);
      failed++;
      failures.push(message);
    }
  } catch (e) {
    console.log(`  ✗ ${message} (error: ${e.message})`);
    failed++;
    failures.push(message);
  }
}

// ===== Task Tests =====
console.log('\nTask Tests:');

// Test 1: Basic task creation
const t1 = new Task('t1', 'Test Task', 5);
assert(t1.id === 't1' && t1.priority === 5 && t1.status === 'pending', 'task created with correct properties');

// Test 2: Task lifecycle (pending -> running -> completed)
const t2 = new Task('t2', 'Lifecycle Test');
t2.start();
assert(t2.status === 'running', 'task starts correctly');
t2.complete('done');
assert(t2.status === 'completed' && t2.result === 'done', 'task completes correctly');

// Test 3: Cannot start a completed task
const t3 = new Task('t3', 'No Restart');
t3.start();
t3.complete('done');
assertThrows(() => t3.start(), 'cannot start completed task');

// Test 4: Cannot start a cancelled task
const t4 = new Task('t4', 'No Start After Cancel');
t4.cancel();
assertThrows(() => t4.start(), 'cannot start cancelled task');

// Test 5: Self-dependency throws
const t5 = new Task('t5', 'Self Dep');
assertThrows(() => t5.addDependency('t5'), 'self-dependency throws error');

// Test 6: Task with no dependencies is ready
const t6 = new Task('t6', 'No Deps');
assert(t6.isReady([]) === true, 'task with no dependencies is ready');

// Test 7: Task with unmet dependencies is not ready
const t7 = new Task('t7', 'Has Deps');
t7.addDependency('dep1');
t7.addDependency('dep2');
assert(t7.isReady(['dep1']) === false, 'task with partial deps is not ready');

// Test 8: Task with all dependencies met is ready
assert(t7.isReady(['dep1', 'dep2', 'dep3']) === true, 'task with all deps met is ready');

// ===== Queue Tests =====
console.log('\nQueue Tests:');

// Test 9: Add and retrieve tasks
const q1 = new TaskQueue();
q1.add('a', 'Task A', 3);
q1.add('b', 'Task B', 7);
q1.add('c', 'Task C', 1);
assert(q1.size() === 3, 'queue has 3 tasks');

// Test 10: Duplicate task id throws
assertThrows(() => q1.add('a', 'Dup', 1), 'duplicate task id throws');

// Test 11: getSorted returns highest priority first
const sorted = q1.getSorted();
assert(sorted[0].id === 'b' && sorted[1].id === 'a' && sorted[2].id === 'c',
  'getSorted returns highest priority first');

// Test 12: getNext returns highest priority ready task
const q2 = new TaskQueue();
q2.add('lo', 'Low', 1);
q2.add('hi', 'High', 10);
const next = q2.getNext();
assert(next !== null && next.id === 'hi', 'getNext returns highest priority task');

// Test 13: getNext respects dependencies
const q3 = new TaskQueue();
const qA = q3.add('qA', 'Task A', 5);
const qB = q3.add('qB', 'Task B', 10);
qB.addDependency('qA');
const nextQ3 = q3.getNext();
assert(nextQ3 !== null && nextQ3.id === 'qA', 'getNext skips tasks with unmet dependencies');

// Test 14: processNext works
const q4 = new TaskQueue();
q4.add('p1', 'Process Me', 5);

async function test14() {
  const processed = await q4.processNext((task) => `processed-${task.id}`);
  return processed !== null && processed.status === 'completed' && processed.result === 'processed-p1';
}

// Test 15: processNext handles errors
const q5 = new TaskQueue();
q5.add('e1', 'Error Task', 5);

async function test15() {
  const processed = await q5.processNext(() => { throw new Error('oops'); });
  return processed !== null && processed.status === 'failed' && processed.result === 'oops';
}

// Test 16: Cannot remove running task
const q6 = new TaskQueue();
q6.add('r1', 'Running', 5);
q6.get('r1').start();
assertThrows(() => q6.remove('r1'), 'cannot remove running task');

// Test 17: Remove cleans up dependencies
const q7 = new TaskQueue();
q7.add('d1', 'Dep Task', 5);
const d2 = q7.add('d2', 'Main Task', 5);
d2.addDependency('d1');
q7.remove('d1');
assert(d2.dependencies.length === 0, 'remove cleans up dependencies in other tasks');

// Test 18: Stats are accurate
const q8 = new TaskQueue();
q8.add('s1', 'A', 1);
q8.add('s2', 'B', 2);
q8.get('s1').start();
q8.get('s1').complete('ok');
const stats = q8.stats();
assert(stats.total === 2 && stats.completed === 1 && stats.pending === 1, 'stats are accurate');

// Test 19: Clear with running task throws
const q9 = new TaskQueue();
q9.add('c1', 'Clear Me', 5);
q9.get('c1').start();
assertThrows(() => q9.clear(), 'cannot clear with running tasks');

// ===== Scheduler Tests =====
console.log('\nScheduler Tests:');

// Test 20: Basic scheduling
const s1 = new Scheduler();
s1.addTask('x1', 'Task X1', 5);
s1.addTask('x2', 'Task X2', 10);
assert(s1.queue.size() === 2, 'scheduler adds tasks to queue');

// Test 21: Dependency via scheduler
const s2 = new Scheduler();
s2.addTask('a', 'A', 1);
s2.addTask('b', 'B', 2, ['a']);
const taskB = s2.queue.get('b');
assert(taskB.dependencies.includes('a'), 'scheduler sets up dependencies');

// Test 22: Cycle detection
const s3 = new Scheduler();
s3.addTask('c1', 'C1', 1);
s3.addTask('c2', 'C2', 1, ['c1']);
assertThrows(() => s3.addDependency('c1', 'c2'), 'cycle detection prevents circular deps');

// Test 23: processBatch respects maxConcurrent
const s4 = new Scheduler();
s4.maxConcurrent = 2;
s4.addTask('b1', 'B1', 1);
s4.addTask('b2', 'B2', 2);
s4.addTask('b3', 'B3', 3);

async function test23() {
  const results = await s4.processBatch((task) => `done-${task.id}`);
  // With maxConcurrent=2 and 0 running, should process exactly 2
  return results.length === 2;
}

// Test 24: processBatch processes highest priority first
async function test24() {
  // From test23, b3 (pri=3) and b2 (pri=2) should have been processed
  const b3 = s4.queue.get('b3');
  const b2 = s4.queue.get('b2');
  const b1 = s4.queue.get('b1');
  return b3.status === 'completed' && b2.status === 'completed' && b1.status === 'pending';
}

// Test 25: processBatch accounts for running tasks
const s5 = new Scheduler();
s5.maxConcurrent = 2;
s5.addTask('r1', 'R1', 1);
s5.addTask('r2', 'R2', 2);
s5.addTask('r3', 'R3', 3);
s5.queue.get('r3').start(); // One already running

async function test25() {
  const results = await s5.processBatch((task) => `done-${task.id}`);
  // maxConcurrent=2, 1 running, so only 1 slot available
  return results.length === 1;
}

// Test 26: processBatch records history
async function test26() {
  const s = new Scheduler();
  s.addTask('h1', 'H1', 5);
  await s.processBatch((task) => 'ok');
  return s.getHistory().length === 1 && s.getHistory()[0].taskId === 'h1';
}

// Test 27: Execution order respects dependencies
const s6 = new Scheduler();
s6.addTask('e1', 'E1', 1);
s6.addTask('e2', 'E2', 2, ['e1']);
s6.addTask('e3', 'E3', 3, ['e2']);
const order = s6.getExecutionOrder();
assert(order.indexOf('e1') < order.indexOf('e2') && order.indexOf('e2') < order.indexOf('e3'),
  'execution order respects dependency chain');

// Test 28: Execution order detects cycles
const s7 = new Scheduler();
s7.addTask('cy1', 'CY1', 1);
s7.addTask('cy2', 'CY2', 1, ['cy1']);
// Manually create cycle (bypassing cycle check for testing)
s7.queue.get('cy1').addDependency('cy2');
assertThrows(() => s7.getExecutionOrder(), 'execution order detects cycles');

// Test 29: Scheduler stats include history
const s8 = new Scheduler();
s8.addTask('st1', 'ST1', 5);

async function test29() {
  await s8.processBatch((t) => 'ok');
  const stats = s8.getStats();
  return stats.historyLength === 1 && stats.completed === 1 && stats.maxConcurrent === 3;
}

// Test 30: Full pipeline - dependencies + batch processing
const s9 = new Scheduler();
s9.maxConcurrent = 5;
s9.addTask('p1', 'Phase 1A', 1);
s9.addTask('p2', 'Phase 1B', 2);
s9.addTask('p3', 'Phase 2', 3, ['p1', 'p2']);

async function test30() {
  // First batch: p1 and p2 (p3 has unmet deps)
  let results = await s9.processBatch((t) => `done-${t.id}`);
  if (results.length !== 2) return false;
  
  const p3status = s9.queue.get('p3').status;
  if (p3status !== 'pending') return false;

  // Second batch: p3 now ready (deps met)
  results = await s9.processBatch((t) => `done-${t.id}`);
  if (results.length !== 1) return false;
  
  return s9.queue.get('p3').status === 'completed';
}

// Run async tests
async function runAsyncTests() {
  await assertAsync(test14, 'processNext completes task with handler result');
  await assertAsync(test15, 'processNext handles handler errors');
  await assertAsync(test23, 'processBatch respects maxConcurrent limit');
  await assertAsync(test24, 'processBatch processes highest priority first');
  await assertAsync(test25, 'processBatch accounts for already running tasks');
  await assertAsync(test26, 'processBatch records history');
  await assertAsync(test29, 'scheduler stats include history and config');
  await assertAsync(test30, 'full pipeline: deps + batch processing works');

  console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed`);
  if (failures.length > 0) {
    console.log('\nFailed tests:');
    failures.forEach((f) => console.log(`  - ${f}`));
  }
  process.exit(failed > 0 ? 1 : 0);
}

runAsyncTests();
