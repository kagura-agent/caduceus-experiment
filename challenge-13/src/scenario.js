const { SmartCache, BatchedCache } = require('./cache');

// Scenario: A web app uses these caches for session tokens.
// maxSize = 3, ttlMs = 5000 (5 seconds)
// Operations happen at these timestamps (relative to creation):

// t=0ms:    cache created
// t=100ms:  set("alice", "token-A")
// t=200ms:  set("bob", "token-B")
// t=300ms:  set("carol", "token-C")
// t=400ms:  get("alice")
// t=500ms:  set("dave", "token-D")
// t=600ms:  get("bob")
// t=700ms:  get("carol")
// t=800ms:  set("eve", "token-E")
// t=900ms:  get("dave")
// t=1000ms: getStats()

// The test harness uses fake time (Date.now is mocked)
function runScenario(CacheClass) {
  let fakeNow = 1000000; // start at arbitrary epoch
  const realDateNow = Date.now;
  Date.now = () => fakeNow;

  try {
    const cache = new CacheClass(3, 5000);
    const results = [];

    fakeNow = 1000000 + 100;
    cache.set("alice", "token-A");

    fakeNow = 1000000 + 200;
    cache.set("bob", "token-B");

    fakeNow = 1000000 + 300;
    cache.set("carol", "token-C");

    fakeNow = 1000000 + 400;
    results.push({ op: 'get("alice")', result: cache.get("alice") });

    fakeNow = 1000000 + 500;
    cache.set("dave", "token-D");

    fakeNow = 1000000 + 600;
    results.push({ op: 'get("bob")', result: cache.get("bob") });

    fakeNow = 1000000 + 700;
    results.push({ op: 'get("carol")', result: cache.get("carol") });

    fakeNow = 1000000 + 800;
    cache.set("eve", "token-E");

    fakeNow = 1000000 + 900;
    results.push({ op: 'get("dave")', result: cache.get("dave") });

    fakeNow = 1000000 + 1000;
    results.push({ op: 'getStats()', result: cache.getStats() });

    return results;
  } finally {
    Date.now = realDateNow;
  }
}

console.log("=== SmartCache (X) ===");
console.log(JSON.stringify(runScenario(SmartCache), null, 2));
console.log("\n=== BatchedCache (Y) ===");
console.log(JSON.stringify(runScenario(BatchedCache), null, 2));
