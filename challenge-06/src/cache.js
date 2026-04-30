// LRU Cache with TTL, size limits, and event hooks
// All tests pass. Ship it? 🚢

class LRUCache {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 100;
    this.defaultTTL = options.defaultTTL || 0; // 0 = no expiry
    this.maxEntrySize = options.maxEntrySize || Infinity;
    this.onEvict = options.onEvict || null;
    this.onExpire = options.onExpire || null;

    this._store = new Map();
    this._timers = {};
    this._stats = { hits: 0, misses: 0, evictions: 0 };
  }

  set(key, value, ttl) {
    const effectiveTTL = ttl !== undefined ? ttl : this.defaultTTL;

    const size = this._estimateSize(value);
    if (size > this.maxEntrySize) {
      return false;
    }

    if (this._timers[key]) {
      clearTimeout(this._timers[key]);
    }

    if (this._store.size >= this.maxSize && !this._store.has(key)) {
      this._evictLRU();
    }

    this._store.delete(key);
    this._store.set(key, { value, size, createdAt: Date.now() });

    if (effectiveTTL > 0) {
      this._timers[key] = setTimeout(() => {
        const entry = this._store.get(key);
        if (entry && this.onExpire) {
          this.onExpire(key, entry.value);
        }
        this._store.delete(key);
        delete this._timers[key];
      }, effectiveTTL);
    }

    return true;
  }

  get(key) {
    const entry = this._store.get(key);
    if (!entry) {
      this._stats.misses++;
      return undefined;
    }

    this._stats.hits++;

    this._store.delete(key);
    this._store.set(key, entry);

    return entry.value;
  }

  has(key) {
    return this._store.has(key);
  }

  delete(key) {
    const entry = this._store.get(key);
    if (!entry) return false;

    if (this._timers[key]) {
      clearTimeout(this._timers[key]);
      delete this._timers[key];
    }

    this._store.delete(key);
    return true;
  }

  clear() {
    for (const key in this._timers) {
      clearTimeout(this._timers[key]);
    }
    this._timers = {};
    this._store.clear();
  }

  get size() {
    return this._store.size;
  }

  getStats() {
    return { ...this._stats };
  }

  keys() {
    return [...this._store.keys()];
  }

  values() {
    return [...this._store.values()].map(e => e.value);
  }

  entries() {
    return [...this._store.entries()].map(([k, e]) => [k, e.value]);
  }

  forEach(callback) {
    for (const [key, entry] of this._store) {
      callback(entry.value, key, this);
    }
  }

  _evictLRU() {
    const firstKey = this._store.keys().next().value;
    const entry = this._store.get(firstKey);

    if (this.onEvict) {
      this.onEvict(firstKey, entry.value);
    }

    if (this._timers[firstKey]) {
      clearTimeout(this._timers[firstKey]);
      delete this._timers[firstKey];
    }

    this._store.delete(firstKey);
    this._stats.evictions++;
  }

  _estimateSize(value) {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'string') return value.length * 2;
    if (typeof value === 'number') return 8;
    if (typeof value === 'boolean') return 4;
    if (Buffer.isBuffer(value)) return value.length;
    return JSON.stringify(value).length * 2;
  }
}

module.exports = { LRUCache };
