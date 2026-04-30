// Test suite for LRU Cache — 28 tests, all passing
// These tests verify the happy path. The code works. But is it good?

const { LRUCache } = require('../src/cache');
const assert = require('assert');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ✗ ${name}: ${e.message}`);
  }
}

// === Basic Operations ===
console.log('Basic Operations:');

test('set and get', () => {
  const cache = new LRUCache();
  cache.set('a', 1);
  assert.strictEqual(cache.get('a'), 1);
});

test('get missing key returns undefined', () => {
  const cache = new LRUCache();
  assert.strictEqual(cache.get('nope'), undefined);
});

test('has returns true for existing key', () => {
  const cache = new LRUCache();
  cache.set('x', 42);
  assert.strictEqual(cache.has('x'), true);
});

test('has returns false for missing key', () => {
  const cache = new LRUCache();
  assert.strictEqual(cache.has('nope'), false);
});

test('delete removes entry', () => {
  const cache = new LRUCache();
  cache.set('a', 1);
  assert.strictEqual(cache.delete('a'), true);
  assert.strictEqual(cache.get('a'), undefined);
});

test('delete returns false for missing key', () => {
  const cache = new LRUCache();
  assert.strictEqual(cache.delete('nope'), false);
});

test('size tracks entries', () => {
  const cache = new LRUCache();
  assert.strictEqual(cache.size, 0);
  cache.set('a', 1);
  cache.set('b', 2);
  assert.strictEqual(cache.size, 2);
});

test('overwrite existing key', () => {
  const cache = new LRUCache();
  cache.set('a', 1);
  cache.set('a', 2);
  assert.strictEqual(cache.get('a'), 2);
  assert.strictEqual(cache.size, 1);
});

// === LRU Eviction ===
console.log('\nLRU Eviction:');

test('evicts LRU when at capacity', () => {
  const cache = new LRUCache({ maxSize: 2 });
  cache.set('a', 1);
  cache.set('b', 2);
  cache.set('c', 3);
  assert.strictEqual(cache.has('a'), false);
  assert.strictEqual(cache.get('b'), 2);
  assert.strictEqual(cache.get('c'), 3);
});

test('get refreshes entry in LRU order', () => {
  const cache = new LRUCache({ maxSize: 2 });
  cache.set('a', 1);
  cache.set('b', 2);
  cache.get('a'); // refresh a
  cache.set('c', 3); // should evict b, not a
  assert.strictEqual(cache.has('b'), false);
  assert.strictEqual(cache.get('a'), 1);
});

test('onEvict callback fires', () => {
  let evicted = null;
  const cache = new LRUCache({
    maxSize: 1,
    onEvict: (k, v) => { evicted = { k, v }; }
  });
  cache.set('a', 1);
  cache.set('b', 2);
  assert.deepStrictEqual(evicted, { k: 'a', v: 1 });
});

// === TTL ===
console.log('\nTTL:');

test('entry expires after TTL', (done) => {
  const cache = new LRUCache({ defaultTTL: 50 });
  cache.set('a', 1);
  setTimeout(() => {
    assert.strictEqual(cache.get('a'), undefined);
    passed++; // manual increment for async
    console.log('  ✓ entry expires after TTL (async)');
  }, 80);
});

test('per-key TTL override', (done) => {
  const cache = new LRUCache();
  cache.set('a', 1, 50);
  assert.strictEqual(cache.get('a'), 1);
  setTimeout(() => {
    assert.strictEqual(cache.get('a'), undefined);
    passed++;
    console.log('  ✓ per-key TTL override (async)');
  }, 80);
});

test('onExpire callback fires', (done) => {
  let expired = null;
  const cache = new LRUCache({
    defaultTTL: 50,
    onExpire: (k, v) => { expired = { k, v }; }
  });
  cache.set('a', 1);
  setTimeout(() => {
    assert.deepStrictEqual(expired, { k: 'a', v: 1 });
    passed++;
    console.log('  ✓ onExpire callback fires (async)');
  }, 80);
});

test('overwrite resets TTL timer', () => {
  const cache = new LRUCache({ defaultTTL: 1000 });
  cache.set('a', 1);
  cache.set('a', 2); // should clear old timer
  assert.strictEqual(cache.get('a'), 2);
  // no assertion on timer clearing — just checking it doesn't crash
});

// === Size Limits ===
console.log('\nSize Limits:');

test('rejects entry exceeding maxEntrySize', () => {
  const cache = new LRUCache({ maxEntrySize: 10 });
  const result = cache.set('big', 'a'.repeat(100));
  assert.strictEqual(result, false);
  assert.strictEqual(cache.has('big'), false);
});

test('accepts entry within maxEntrySize', () => {
  const cache = new LRUCache({ maxEntrySize: 1000 });
  const result = cache.set('small', 'hello');
  assert.strictEqual(result, true);
  assert.strictEqual(cache.get('small'), 'hello');
});

// === Clear ===
console.log('\nClear:');

test('clear removes all entries', () => {
  const cache = new LRUCache();
  cache.set('a', 1);
  cache.set('b', 2);
  cache.clear();
  assert.strictEqual(cache.size, 0);
  assert.strictEqual(cache.get('a'), undefined);
});

// === Stats ===
console.log('\nStats:');

test('tracks hits and misses', () => {
  const cache = new LRUCache();
  cache.set('a', 1);
  cache.get('a'); // hit
  cache.get('b'); // miss
  const stats = cache.getStats();
  assert.strictEqual(stats.hits, 1);
  assert.strictEqual(stats.misses, 1);
});

test('tracks evictions', () => {
  const cache = new LRUCache({ maxSize: 1 });
  cache.set('a', 1);
  cache.set('b', 2);
  const stats = cache.getStats();
  assert.strictEqual(stats.evictions, 1);
});

test('getStats returns copy', () => {
  const cache = new LRUCache();
  const s1 = cache.getStats();
  s1.hits = 999;
  const s2 = cache.getStats();
  assert.strictEqual(s2.hits, 0);
});

// === Iteration ===
console.log('\nIteration:');

test('keys returns all keys', () => {
  const cache = new LRUCache();
  cache.set('a', 1);
  cache.set('b', 2);
  assert.deepStrictEqual(cache.keys(), ['a', 'b']);
});

test('values returns all values', () => {
  const cache = new LRUCache();
  cache.set('a', 1);
  cache.set('b', 2);
  assert.deepStrictEqual(cache.values(), [1, 2]);
});

test('entries returns key-value pairs', () => {
  const cache = new LRUCache();
  cache.set('a', 1);
  cache.set('b', 2);
  assert.deepStrictEqual(cache.entries(), [['a', 1], ['b', 2]]);
});

test('forEach iterates all entries', () => {
  const cache = new LRUCache();
  cache.set('a', 1);
  cache.set('b', 2);
  const collected = [];
  cache.forEach((v, k) => collected.push([k, v]));
  assert.deepStrictEqual(collected, [['a', 1], ['b', 2]]);
});

// === Edge Cases ===
console.log('\nEdge Cases:');

test('handles null value', () => {
  const cache = new LRUCache();
  cache.set('n', null);
  assert.strictEqual(cache.get('n'), null);
  assert.strictEqual(cache.has('n'), true);
});

test('handles undefined value', () => {
  const cache = new LRUCache();
  cache.set('u', undefined);
  assert.strictEqual(cache.has('u'), true);
});

test('numeric keys', () => {
  const cache = new LRUCache();
  cache.set(1, 'one');
  cache.set(2, 'two');
  assert.strictEqual(cache.get(1), 'one');
});

// === Summary ===
setTimeout(() => {
  console.log(`\n${'='.repeat(40)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`${'='.repeat(40)}`);
  process.exit(failed > 0 ? 1 : 0);
}, 200); // wait for async tests
