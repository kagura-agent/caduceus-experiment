// Test runner for Challenge 05: Bug Hunt
// These tests are CORRECT - do NOT modify!

const { TaskQueue } = require('../src/task-queue');

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

async function runTests() {

  // ===== Basic Add & Has =====
  console.log('\nBasic Add & Has:');

  const q1 = new TaskQueue();
  const id1 = q1.add(() => 42, { id: 'a' });
  assert(id1 === 'a', 'add returns task id');
  assert(q1.has('a'), 'has returns true for added task');
  assert(!q1.has('b'), 'has returns false for unknown task');

  // Auto-generated IDs
  const q1b = new TaskQueue();
  const autoId = q1b.add(() => 1);
  assert(autoId === 'task-0', 'auto-generates id when not provided');

  // ===== Basic Execution =====
  console.log('\nBasic Execution:');

  const q2 = new TaskQueue();
  q2.add(() => 'hello', { id: 'greet' });
  await q2.run();
  const r2 = q2.getResult('greet');
  assert(r2 !== null, 'result exists after run');
  assert(r2.status === 'completed', 'successful task is completed');
  assert(r2.result === 'hello', 'result contains return value');
  assert(r2.attempts === 1, 'successful task took 1 attempt');

  // Result shape check (no extra fields)
  const keys2 = Object.keys(r2).sort();
  assert(
    keys2.length === 4 && keys2.join(',') === 'attempts,error,result,status',
    'result has exactly 4 fields: status, result, error, attempts'
  );

  // ===== Async Tasks =====
  console.log('\nAsync Tasks:');

  const q3 = new TaskQueue();
  q3.add(async () => {
    return new Promise(resolve => setTimeout(() => resolve('async!'), 10));
  }, { id: 'async' });
  await q3.run();
  assert(q3.getResult('async').result === 'async!', 'async task resolves correctly');

  // ===== Priority Ordering =====
  console.log('\nPriority Ordering:');

  const q4 = new TaskQueue();
  const order4 = [];
  q4.add(() => { order4.push('low'); }, { id: 'low', priority: 1 });
  q4.add(() => { order4.push('high'); }, { id: 'high', priority: 10 });
  q4.add(() => { order4.push('mid'); }, { id: 'mid', priority: 5 });
  await q4.run();
  assert(order4[0] === 'high' && order4[1] === 'mid' && order4[2] === 'low',
    'tasks execute in priority order (highest first)');

  // Zero priority should work
  const q4b = new TaskQueue();
  const order4b = [];
  q4b.add(() => { order4b.push('zero'); }, { id: 'z', priority: 0 });
  q4b.add(() => { order4b.push('five'); }, { id: 'f', priority: 5 });
  await q4b.run();
  assert(order4b[0] === 'five' && order4b[1] === 'zero',
    'priority 0 works correctly (not treated as falsy)');

  // ===== Retries =====
  console.log('\nRetries:');

  // Task that fails twice then succeeds (needs 2 retries)
  const q5 = new TaskQueue();
  let attempts5 = 0;
  q5.add(() => {
    attempts5++;
    if (attempts5 < 3) throw new Error('not yet');
    return 'finally!';
  }, { id: 'retry', retries: 2 });
  await q5.run();
  const r5 = q5.getResult('retry');
  assert(r5.status === 'completed', 'task succeeds after retries');
  assert(r5.result === 'finally!', 'retry result is correct');
  assert(r5.attempts === 3, 'took 3 attempts (1 initial + 2 retries)');

  // Task that always fails, exhausts retries
  const q5b = new TaskQueue();
  q5b.add(() => { throw new Error('nope'); }, { id: 'doomed', retries: 2 });
  await q5b.run();
  const r5b = q5b.getResult('doomed');
  assert(r5b.status === 'failed', 'task fails after exhausting retries');
  assert(r5b.attempts === 3, 'exhausted all 3 attempts');
  assert(r5b.error instanceof Error, 'error is preserved');

  // No retries = 1 attempt
  const q5c = new TaskQueue();
  q5c.add(() => { throw new Error('once'); }, { id: 'noretry', retries: 0 });
  await q5c.run();
  assert(q5c.getResult('noretry').attempts === 1, 'no retries means exactly 1 attempt');

  // ===== Timeout =====
  console.log('\nTimeout:');

  const q6 = new TaskQueue();
  q6.add(() => new Promise(resolve => setTimeout(resolve, 500)), {
    id: 'slow',
    timeout: 50
  });
  await q6.run();
  const r6 = q6.getResult('slow');
  assert(r6.status === 'failed', 'timed out task fails');
  assert(r6.error.message === 'Task timed out', 'timeout error message is correct');

  // Task that completes within timeout
  const q6b = new TaskQueue();
  q6b.add(() => new Promise(resolve => setTimeout(() => resolve('fast'), 10)), {
    id: 'quick',
    timeout: 200
  });
  await q6b.run();
  assert(q6b.getResult('quick').status === 'completed', 'task within timeout succeeds');

  // ===== Dependencies =====
  console.log('\nDependencies:');

  const q7 = new TaskQueue();
  const order7 = [];
  q7.add(() => { order7.push('first'); return 1; }, { id: 'a' });
  q7.add(() => { order7.push('second'); return 2; }, { id: 'b', dependencies: ['a'] });
  await q7.run();
  assert(order7[0] === 'first' && order7[1] === 'second',
    'dependent task runs after dependency');
  assert(q7.getResult('b').status === 'completed', 'dependent task completes');

  // Failed dependency
  const q7b = new TaskQueue();
  q7b.add(() => { throw new Error('fail'); }, { id: 'x' });
  q7b.add(() => 'never', { id: 'y', dependencies: ['x'] });
  await q7b.run();
  assert(q7b.getResult('y').status === 'failed', 'task with failed dependency also fails');
  assert(q7b.getResult('y').error.message === 'Dependency failed',
    'dependency failure message is correct');

  // ===== Stats =====
  console.log('\nStats:');

  const q8 = new TaskQueue();
  q8.add(() => 'ok', { id: 'good' });
  q8.add(() => { throw new Error('bad'); }, { id: 'bad' });
  q8.add(() => 'also ok', { id: 'good2' });
  await q8.run();
  const stats = q8.getStats();
  assert(stats.total === 3, 'stats total is correct');
  assert(stats.completed === 2, 'stats completed is correct');
  assert(stats.failed === 1, 'stats failed is correct');
  assert(stats.pending === 0, 'stats pending is 0 after run');

  // ===== GetOrder =====
  console.log('\nGetOrder:');

  const q9 = new TaskQueue();
  q9.add(() => {}, { id: 'low', priority: 1 });
  q9.add(() => {}, { id: 'high', priority: 10 });
  q9.add(() => {}, { id: 'mid', priority: 5 });
  const order9 = q9.getOrder();
  assert(order9[0] === 'high' && order9[1] === 'mid' && order9[2] === 'low',
    'getOrder returns priority-sorted ids');

  // ===== Reset =====
  console.log('\nReset:');

  const q10 = new TaskQueue();
  q10.add(() => 1, { id: 'x' });
  q10.add(() => 2, { id: 'y' });
  await q10.run();
  q10.reset();
  assert(!q10.has('x'), 'reset clears tasks');
  assert(q10.getResult('x') === null, 'reset clears results');
  assert(q10.getOrder().length === 0, 'reset clears order');

  // ===== Summary =====
  console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed`);
  if (failures.length > 0) {
    console.log('\nFailed tests:');
    failures.forEach((f) => console.log(`  - ${f}`));
  }
  if (passed === 34 && failed === 0) {
    console.log('\n🎉 All tests pass! All 8 bugs found and fixed!');
  }
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test runner crashed:', err);
  process.exit(1);
});
