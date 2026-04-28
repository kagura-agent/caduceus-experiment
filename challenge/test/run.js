/**
 * Simple test runner — no dependencies needed.
 */
let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEqual(actual, expected, message) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    throw new Error(`${message || 'assertEqual'}: expected ${e}, got ${a}`);
  }
}

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed++;
    failures.push({ name, error: err.message });
    console.log(`  ✗ ${name}`);
    console.log(`    ${err.message}`);
  }
}

// ===== TaskQueue Tests =====
console.log('\nTaskQueue:');
const { TaskQueue } = require('../src/task-queue');

test('add and retrieve tasks in priority order', () => {
  const q = new TaskQueue();
  q.add({ id: 'low', priority: 1, data: 'low' });
  q.add({ id: 'high', priority: 10, data: 'high' });
  q.add({ id: 'mid', priority: 5, data: 'mid' });

  assertEqual(q.next().id, 'high');
  assertEqual(q.next().id, 'mid');
  assertEqual(q.next().id, 'low');
});

test('reject duplicate ids', () => {
  const q = new TaskQueue();
  assertEqual(q.add({ id: 'a', priority: 1 }), true);
  assertEqual(q.add({ id: 'a', priority: 2 }), false);
  assertEqual(q.size, 1);
});

test('force re-add overrides existing', () => {
  const q = new TaskQueue();
  q.add({ id: 'a', priority: 1, data: 'old' });
  q.add({ id: 'a', priority: 5, data: 'new' }, true);
  const task = q.next();
  assertEqual(task.data, 'new');
  assertEqual(task.priority, 5);
});

test('completed tasks rejected on re-add', () => {
  const q = new TaskQueue();
  q.add({ id: 'a', priority: 1 });
  q.next(); // completes 'a'
  assertEqual(q.add({ id: 'a', priority: 1 }), false);
});

test('batch add returns correct count', () => {
  const q = new TaskQueue();
  const count = q.addBatch([
    { id: 'a', priority: 1 },
    { id: 'b', priority: 2 },
    { id: 'a', priority: 3 }, // duplicate
  ]);
  assertEqual(count, 2);
});

test('peek does not remove', () => {
  const q = new TaskQueue();
  q.add({ id: 'x', priority: 1 });
  assertEqual(q.peek().id, 'x');
  assertEqual(q.size, 1);
});

test('clear keeps completed set', () => {
  const q = new TaskQueue();
  q.add({ id: 'a', priority: 1 });
  q.next(); // completes 'a'
  q.add({ id: 'b', priority: 1 });
  q.clear();
  assertEqual(q.size, 0);
  // 'a' still in completed
  assertEqual(q.add({ id: 'a', priority: 1 }), false);
});

test('reset clears everything', () => {
  const q = new TaskQueue();
  q.add({ id: 'a', priority: 1 });
  q.next();
  q.reset();
  assertEqual(q.add({ id: 'a', priority: 1 }), true);
});

// ===== Utils Tests =====
console.log('\nUtils:');
const { groupBy, mergeTasks, filterByPriority, sortTasks, summarize } = require('../src/utils');

test('groupBy groups correctly', () => {
  const tasks = [
    { id: 'a', priority: 1 },
    { id: 'b', priority: 2 },
    { id: 'c', priority: 1 },
  ];
  const groups = groupBy(tasks, t => t.priority);
  assertEqual(groups[1].length, 2);
  assertEqual(groups[2].length, 1);
});

test('mergeTasks combines and overrides', () => {
  const base = [{ id: 'a', data: 'old' }, { id: 'b', data: 'keep' }];
  const override = [{ id: 'a', data: 'new' }, { id: 'c', data: 'added' }];
  const result = mergeTasks(base, override);
  assertEqual(result.length, 3);
  const a = result.find(t => t.id === 'a');
  assertEqual(a.data, 'new');
});

test('filterByPriority uses strict greater-than', () => {
  const tasks = [
    { id: 'a', priority: 5 },
    { id: 'b', priority: 3 },
    { id: 'c', priority: 8 },
  ];
  const result = filterByPriority(tasks, 4);
  assertEqual(result.length, 2);
  assert(result.every(t => t.priority > 4));
});

test('sortTasks by priority desc then id asc', () => {
  const tasks = [
    { id: 'b', priority: 5 },
    { id: 'a', priority: 5 },
    { id: 'c', priority: 10 },
  ];
  const sorted = sortTasks(tasks);
  assertEqual(sorted[0].id, 'c');
  assertEqual(sorted[1].id, 'a');
  assertEqual(sorted[2].id, 'b');
});

test('summarize counts correctly', () => {
  const tasks = [
    { id: 'a', priority: 1 },
    { id: 'b', priority: 2 },
    { id: 'c', priority: 1 },
    { id: 'd' }, // no priority = 0
  ];
  const result = summarize(tasks);
  assertEqual(result.total, 4);
  assertEqual(result.byPriority[1], 2);
  assertEqual(result.byPriority[0], 1);
});

// ===== Scheduler Tests =====
console.log('\nScheduler:');
const { Scheduler } = require('../src/scheduler');

test('scheduler processes tasks', async () => {
  const results = [];
  const scheduler = new Scheduler({
    onComplete: (task) => results.push(task.id),
  });
  scheduler.schedule({ id: 'a', priority: 1, data: () => {} });
  scheduler.schedule({ id: 'b', priority: 2, data: () => {} });
  scheduler.start();

  // Give async tasks time to complete
  await new Promise(r => setTimeout(r, 50));
  assertEqual(results.length, 2);
  // Higher priority first
  assertEqual(results[0], 'b');
});

test('scheduler stats track correctly', async () => {
  const scheduler = new Scheduler();
  scheduler.schedule({ id: 'a', priority: 1, data: () => {} });
  scheduler.schedule({ id: 'b', priority: 2, data: () => {} });
  scheduler.start();

  await new Promise(r => setTimeout(r, 50));
  const stats = scheduler.getStats();
  assertEqual(stats.completed, 2);
  assertEqual(stats.failed, 0);
  assertEqual(stats.pending, 0);
});

test('scheduler handles task errors', async () => {
  const errors = [];
  const scheduler = new Scheduler({
    onError: (task, err) => errors.push({ id: task.id, msg: err.message }),
  });
  scheduler.schedule({
    id: 'bad',
    priority: 1,
    data: () => { throw new Error('boom'); },
  });
  scheduler.start();

  await new Promise(r => setTimeout(r, 50));
  assertEqual(errors.length, 1);
  assertEqual(errors[0].msg, 'boom');
  assertEqual(scheduler.getStats().failed, 1);
});

test('scheduler pause stops new tasks', async () => {
  const results = [];
  const scheduler = new Scheduler({
    maxConcurrent: 1,
    onComplete: (task) => results.push(task.id),
  });
  scheduler.schedule({ id: 'a', priority: 2, data: () => new Promise(r => setTimeout(r, 30)) });
  scheduler.schedule({ id: 'b', priority: 1, data: () => {} });
  scheduler.start();

  // Pause immediately - 'a' is running, 'b' should not start
  await new Promise(r => setTimeout(r, 5));
  scheduler.pause();
  await new Promise(r => setTimeout(r, 60));

  // Only 'a' should have completed
  assertEqual(results.length, 1);
  assertEqual(results[0], 'a');
});

// ===== Summary =====
console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`);
if (failures.length > 0) {
  console.log('Failures:');
  for (const f of failures) {
    console.log(`  - ${f.name}: ${f.error}`);
  }
  process.exit(1);
}
