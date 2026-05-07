// Implementation X: "Smart Cache"
class SmartCache {
  constructor(maxSize, ttlMs) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
    this.store = new Map();
    this.hits = 0;
    this.misses = 0;
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return undefined;
    }
    if (Date.now() - entry.ts > this.ttlMs) {
      this.store.delete(key);
      this.misses++;
      return undefined;
    }
    this.hits++;
    // Move to end (most recently used)
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value;
  }

  set(key, value) {
    if (this.store.has(key)) {
      this.store.delete(key);
    }
    if (this.store.size >= this.maxSize) {
      // Evict oldest (first entry in Map)
      const oldest = this.store.keys().next().value;
      this.store.delete(oldest);
    }
    this.store.set(key, { value, ts: Date.now() });
  }

  getStats() {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: total === 0 ? 0 : Math.round(this.hits / total * 100) / 100,
      size: this.store.size
    };
  }
}

// Implementation Y: "Batched Cache"
class BatchedCache {
  constructor(maxSize, ttlMs) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
    this.store = new Map();
    this.pending = [];
    this.hits = 0;
    this.misses = 0;
  }

  get(key) {
    this._flush();
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return undefined;
    }
    if (Date.now() - entry.ts > this.ttlMs) {
      this.store.delete(key);
      this.misses++;
      return undefined;
    }
    this.hits++;
    entry.accessCount = (entry.accessCount || 0) + 1;
    return entry.value;
  }

  set(key, value) {
    this.pending.push({ key, value, ts: Date.now() });
    if (this.pending.length >= 3) {
      this._flush();
    }
  }

  _flush() {
    for (const item of this.pending) {
      if (this.store.has(item.key)) {
        this.store.delete(item.key);
      }
      if (this.store.size >= this.maxSize) {
        // Evict least accessed
        let minKey = null, minCount = Infinity;
        for (const [k, v] of this.store) {
          const count = v.accessCount || 0;
          if (count < minCount) {
            minCount = count;
            minKey = k;
          }
        }
        this.store.delete(minKey);
      }
      this.store.set(item.key, { value: item.value, ts: item.ts, accessCount: 0 });
    }
    this.pending = [];
  }

  getStats() {
    this._flush();
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: total === 0 ? 0 : Math.round(this.hits / total * 100) / 100,
      size: this.store.size
    };
  }
}

module.exports = { SmartCache, BatchedCache };
