// Test runner for Challenge 04: Build from Spec
// These tests define the expected behavior - do NOT modify!

const { EventBus } = require('../src/event-bus');

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

// ===== Basic Pub/Sub =====
console.log('\nBasic Pub/Sub:');

// Test 1: on + emit basic
const bus1 = new EventBus();
let received = null;
bus1.on('greet', (name) => { received = name; });
bus1.emit('greet', 'Alice');
assert(received === 'Alice', 'basic on/emit works');

// Test 2: Multiple listeners
const bus2 = new EventBus();
const calls = [];
bus2.on('event', () => calls.push('a'));
bus2.on('event', () => calls.push('b'));
bus2.emit('event');
assert(calls.length === 2 && calls.includes('a') && calls.includes('b'), 'multiple listeners all called');

// Test 3: emit returns listener count
const bus3 = new EventBus();
bus3.on('ping', () => {});
bus3.on('ping', () => {});
const count = bus3.emit('ping');
assert(count === 2, 'emit returns number of listeners called');

// Test 4: emit with no listeners returns 0
const bus4 = new EventBus();
assert(bus4.emit('nothing') === 0, 'emit with no listeners returns 0');

// Test 5: Multiple arguments
const bus5 = new EventBus();
let sum = 0;
bus5.on('add', (a, b, c) => { sum = a + b + c; });
bus5.emit('add', 1, 2, 3);
assert(sum === 6, 'multiple arguments passed correctly');

// Test 6: Different events are independent
const bus6 = new EventBus();
let v1 = 0, v2 = 0;
bus6.on('inc1', () => { v1++; });
bus6.on('inc2', () => { v2++; });
bus6.emit('inc1');
bus6.emit('inc1');
bus6.emit('inc2');
assert(v1 === 2 && v2 === 1, 'events are independent');

// ===== Off (Unsubscribe) =====
console.log('\nOff (Unsubscribe):');

// Test 7: off removes listener
const bus7 = new EventBus();
let counter7 = 0;
const handler7 = () => { counter7++; };
bus7.on('tick', handler7);
bus7.emit('tick');
bus7.off('tick', handler7);
bus7.emit('tick');
assert(counter7 === 1, 'off removes listener correctly');

// Test 8: off returns true when found
const bus8 = new EventBus();
const h8 = () => {};
bus8.on('x', h8);
assert(bus8.off('x', h8) === true, 'off returns true when listener found');

// Test 9: off returns false when not found
const bus9 = new EventBus();
assert(bus9.off('x', () => {}) === false, 'off returns false when listener not found');

// Test 10: off only removes the specific handler
const bus10 = new EventBus();
let r10 = [];
const h10a = () => r10.push('a');
const h10b = () => r10.push('b');
bus10.on('e', h10a);
bus10.on('e', h10b);
bus10.off('e', h10a);
bus10.emit('e');
assert(r10.length === 1 && r10[0] === 'b', 'off only removes specific handler');

// ===== Once =====
console.log('\nOnce:');

// Test 11: once fires only once
const bus11 = new EventBus();
let c11 = 0;
bus11.once('flash', () => { c11++; });
bus11.emit('flash');
bus11.emit('flash');
bus11.emit('flash');
assert(c11 === 1, 'once listener fires only once');

// Test 12: once is included in emit count
const bus12 = new EventBus();
bus12.once('x', () => {});
bus12.on('x', () => {});
const c12 = bus12.emit('x');
assert(c12 === 2, 'once listener counted in emit return');

// Test 13: once listener auto-removed after firing
const bus13 = new EventBus();
bus13.once('x', () => {});
bus13.emit('x');
assert(bus13.listenerCount('x') === 0, 'once listener removed after firing');

// Test 14: once can be manually removed before firing
const bus14 = new EventBus();
const h14 = () => {};
bus14.once('x', h14);
assert(bus14.off('x', h14) === true, 'once listener can be removed with off');
assert(bus14.listenerCount('x') === 0, 'once listener gone after off');

// ===== Wildcard =====
console.log('\nWildcard:');

// Test 15: wildcard receives all events
const bus15 = new EventBus();
const events15 = [];
bus15.on('*', (eventName) => { events15.push(eventName); });
bus15.emit('foo');
bus15.emit('bar');
bus15.emit('baz');
assert(events15.length === 3 && events15[0] === 'foo' && events15[2] === 'baz',
  'wildcard receives all events');

// Test 16: wildcard receives event name as first arg
const bus16 = new EventBus();
let wild16 = null;
bus16.on('*', (eventName, data) => { wild16 = { eventName, data }; });
bus16.emit('test', 42);
assert(wild16 !== null && wild16.eventName === 'test' && wild16.data === 42,
  'wildcard gets event name + args');

// Test 17: wildcard + regular listeners both fire
const bus17 = new EventBus();
let r17 = [];
bus17.on('*', (ev) => r17.push(`wild:${ev}`));
bus17.on('hello', () => r17.push('regular'));
bus17.emit('hello');
assert(r17.length === 2 && r17.includes('wild:hello') && r17.includes('regular'),
  'wildcard and regular listeners both fire');

// Test 18: wildcard counted in emit return
const bus18 = new EventBus();
bus18.on('*', () => {});
bus18.on('x', () => {});
assert(bus18.emit('x') === 2, 'wildcard counted in emit return value');

// Test 19: emitting '*' directly only fires wildcard listeners
const bus19 = new EventBus();
let r19 = [];
bus19.on('*', (ev) => r19.push(`wild:${ev}`));
bus19.on('hello', () => r19.push('hello'));
bus19.emit('*');
assert(r19.length === 1 && r19[0] === 'wild:*', 'emitting * only fires wildcard listeners');

// ===== Priority =====
console.log('\nPriority:');

// Test 20: higher priority called first
const bus20 = new EventBus();
let order20 = [];
bus20.on('e', () => order20.push('low'), 1);
bus20.on('e', () => order20.push('high'), 10);
bus20.on('e', () => order20.push('mid'), 5);
bus20.emit('e');
assert(order20[0] === 'high' && order20[1] === 'mid' && order20[2] === 'low',
  'listeners called in priority order (highest first)');

// Test 21: same priority preserves insertion order
const bus21 = new EventBus();
let order21 = [];
bus21.on('e', () => order21.push('first'), 5);
bus21.on('e', () => order21.push('second'), 5);
bus21.on('e', () => order21.push('third'), 5);
bus21.emit('e');
assert(order21[0] === 'first' && order21[1] === 'second' && order21[2] === 'third',
  'same priority preserves insertion order');

// Test 22: priority works with wildcard listeners
const bus22 = new EventBus();
let order22 = [];
bus22.on('test', () => order22.push('regular'), 1);
bus22.on('*', () => order22.push('wildcard'), 10);
bus22.emit('test');
assert(order22[0] === 'wildcard' && order22[1] === 'regular',
  'priority ordering includes wildcard listeners');

// Test 23: once respects priority
const bus23 = new EventBus();
let order23 = [];
bus23.on('e', () => order23.push('regular'), 1);
bus23.once('e', () => order23.push('once'), 10);
bus23.emit('e');
assert(order23[0] === 'once' && order23[1] === 'regular',
  'once listeners respect priority ordering');

// ===== History =====
console.log('\nHistory:');

// Test 24: emit records history
const bus24 = new EventBus();
bus24.emit('ping', 1);
bus24.emit('pong', 2);
const hist = bus24.getHistory();
assert(hist.length === 2 && hist[0].event === 'ping' && hist[1].event === 'pong',
  'getHistory returns all emissions');

// Test 25: history includes args
const bus25 = new EventBus();
bus25.emit('data', 'hello', 42);
const h25 = bus25.getHistory();
assert(h25.length > 0 && h25[0].args[0] === 'hello' && h25[0].args[1] === 42,
  'history includes emission arguments');

// Test 26: history includes timestamp
const bus26 = new EventBus();
const before = Date.now();
bus26.emit('x');
const after = Date.now();
const h26arr = bus26.getHistory();
assert(h26arr.length > 0 && h26arr[0].timestamp >= before && h26arr[0].timestamp <= after,
  'history includes timestamp');

// Test 27: getHistory filters by event
const bus27 = new EventBus();
bus27.emit('a', 1);
bus27.emit('b', 2);
bus27.emit('a', 3);
const ha = bus27.getHistory('a');
assert(ha.length === 2 && ha[0].args[0] === 1 && ha[1].args[0] === 3,
  'getHistory filters by event name');

// Test 28: history recorded even with no listeners
const bus28 = new EventBus();
bus28.emit('ghost', 'boo');
assert(bus28.getHistory().length === 1, 'history recorded even with no listeners');

// ===== Listener Count =====
console.log('\nListener Count:');

// Test 29: listenerCount for specific event
const bus29 = new EventBus();
bus29.on('a', () => {});
bus29.on('a', () => {});
bus29.on('b', () => {});
assert(bus29.listenerCount('a') === 2, 'listenerCount for specific event');

// Test 30: listenerCount total
assert(bus29.listenerCount() === 3, 'listenerCount without args returns total');

// Test 31: listenerCount includes wildcard in total
const bus31 = new EventBus();
bus31.on('x', () => {});
bus31.on('*', () => {});
assert(bus31.listenerCount() === 2, 'listenerCount includes wildcard listeners');

// Test 32: listenerCount for unknown event is 0
assert(bus31.listenerCount('nope') === 0, 'listenerCount for unknown event is 0');

// ===== Clear =====
console.log('\nClear:');

// Test 33: clear specific event
const bus33 = new EventBus();
bus33.on('a', () => {});
bus33.on('b', () => {});
bus33.clear('a');
assert(bus33.listenerCount('a') === 0 && bus33.listenerCount('b') === 1,
  'clear removes listeners for specific event');

// Test 34: clear all
const bus34 = new EventBus();
bus34.on('a', () => {});
bus34.on('b', () => {});
bus34.clear();
assert(bus34.listenerCount() === 0, 'clear without args removes all listeners');

// Test 35: clear preserves history
const bus35 = new EventBus();
bus35.emit('before');
bus35.clear();
bus35.emit('after');
assert(bus35.getHistory().length === 2, 'clear does not erase history');

// ===== Summary =====
console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed`);
if (failures.length > 0) {
  console.log('\nFailed tests:');
  failures.forEach((f) => console.log(`  - ${f}`));
}
process.exit(failed > 0 ? 1 : 0);
