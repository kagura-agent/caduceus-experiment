# Challenge 16: The Memory Pool 🧠

## Background

You're debugging a **fixed-size memory pool allocator** used in an embedded system. Two implementations exist: a **Bitmap Allocator** (X) and a **Free List Allocator** (Y). Both manage a pool of `poolSize` blocks.

Unit tests pass: allocate, use, free, allocate again — all works. But in production, after ~10,000 allocation cycles, the system reports **pool exhaustion** even though monitoring shows most blocks have been freed. One implementation leaks, the other doesn't.

Your job: trace both, identify the leak, **state the invariant** that the leaky implementation violates, and prove your fix restores it.

## Source Code

```javascript
// Implementation X: "BitmapAllocator"
class BitmapAllocator {
  constructor(poolSize) {
    this.poolSize = poolSize;
    this.bitmap = new Array(poolSize).fill(false); // false = free
    this.allocated = 0;
    this.freedCount = 0;
    this.allocCount = 0;
  }

  alloc() {
    if (this.allocated >= this.poolSize) {
      return { block: -1, error: "pool_exhausted" };
    }
    // Linear scan for first free block
    for (let i = 0; i < this.poolSize; i++) {
      if (!this.bitmap[i]) {
        this.bitmap[i] = true;
        this.allocated++;
        this.allocCount++;
        return { block: i, error: null };
      }
    }
    // Should not reach here if allocated < poolSize
    return { block: -1, error: "bitmap_inconsistent" };
  }

  free(blockId) {
    if (blockId < 0 || blockId >= this.poolSize) {
      return { success: false, error: "invalid_block" };
    }
    if (!this.bitmap[blockId]) {
      return { success: false, error: "double_free" };
    }
    this.bitmap[blockId] = false;
    this.allocated--;
    this.freedCount++;
    return { success: true, error: null };
  }

  stats() {
    return {
      total: this.poolSize,
      used: this.allocated,
      free: this.poolSize - this.allocated,
      totalAllocs: this.allocCount,
      totalFrees: this.freedCount,
    };
  }
}

// Implementation Y: "FreeListAllocator"
class FreeListAllocator {
  constructor(poolSize) {
    this.poolSize = poolSize;
    this.freeList = [];
    // Initialize: all blocks on free list (LIFO stack)
    for (let i = poolSize - 1; i >= 0; i--) {
      this.freeList.push(i);
    }
    this.allocated = new Set();
    this.allocCount = 0;
    this.freedCount = 0;
    this.generation = new Array(poolSize).fill(0);
  }

  alloc() {
    if (this.freeList.length === 0) {
      return { block: -1, error: "pool_exhausted" };
    }
    const blockId = this.freeList.pop();
    this.allocated.add(blockId);
    this.allocCount++;
    this.generation[blockId]++;
    return { block: blockId, gen: this.generation[blockId], error: null };
  }

  free(blockId, gen) {
    if (blockId < 0 || blockId >= this.poolSize) {
      return { success: false, error: "invalid_block" };
    }
    if (!this.allocated.has(blockId)) {
      return { success: false, error: "not_allocated" };
    }
    // Stale free: caller has old generation — block was already recycled
    if (gen !== undefined && gen !== this.generation[blockId]) {
      return { success: false, error: "stale_generation" };
    }
    this.allocated.delete(blockId);
    this.freeList.push(blockId);
    this.freedCount++;
    return { success: true, error: null };
  }

  stats() {
    return {
      total: this.poolSize,
      used: this.allocated.size,
      free: this.freeList.length,
      totalAllocs: this.allocCount,
      totalFrees: this.freedCount,
    };
  }
}
```

## Production Workload Simulation

The system runs allocation cycles in batches. Each cycle: allocate a block, use it for some work, then free it. But the production code has a subtle pattern — sometimes a "late free" arrives for a block that was already freed and reallocated:

```javascript
function simulateWorkload(allocator, isTypeY, cycles) {
  const pending = []; // { blockId, gen? } — blocks in use

  for (let c = 0; c < cycles; c++) {
    // Step 1: Allocate a new block
    const result = isTypeY ? allocator.alloc() : allocator.alloc();
    if (result.error) {
      return { cycle: c, error: result.error, stats: allocator.stats() };
    }
    pending.push({ blockId: result.block, gen: result.gen });

    // Step 2: Occasionally a "late free" arrives — frees the OLDEST pending block
    // This models a slow worker finishing after its block was already timed out and freed
    if (c > 0 && c % 3 === 0 && pending.length > 2) {
      const stale = pending.shift(); // oldest
      if (isTypeY) {
        allocator.free(stale.blockId, stale.gen);
      } else {
        allocator.free(stale.blockId);
      }
    }

    // Step 3: Free the most recent block if queue is getting long
    if (pending.length > 4) {
      const recent = pending.pop();
      if (isTypeY) {
        allocator.free(recent.blockId, recent.gen);
      } else {
        allocator.free(recent.blockId);
      }
    }
  }
  return { cycle: cycles, error: null, stats: allocator.stats() };
}
```

## Configuration
- `poolSize = 8`
- `cycles = 20`

## Questions

### Q1: Trace (20 points)
Trace **both allocators** through the workload simulation for all 20 cycles. For each cycle show:
- The allocation result (block id, or error)
- Whether the "late free" triggers and its result
- Whether the "queue trim" triggers and its result
- The pending array state after each cycle

**Show all state changes. Do not skip cycles.**

### Q2: Divergences (10 points)
List every cycle where X and Y produce a **different outcome** (different block allocated, different free result, or one errors and the other doesn't). For each, explain the root cause of the divergence.

### Q3: Invariant (15 points)
State the **pool consistency invariant** that a correct allocator must maintain. Express it formally:
- What relationship must hold between `allocated`, `freed`, and the pool state after every operation?
- Which implementation violates this invariant, and at which cycle does the violation first occur?
- Why does the violation not show up in simple allocate-free unit tests?

### Q4: Fix and Proof (15 points)
Propose a minimal fix to the broken implementation. Then **prove** that your fix restores the invariant:
- State the invariant formally
- Show that the invariant holds at initialization
- Show that each operation (alloc, free) preserves the invariant
- Show that the bug scenario (late/stale free) is now handled correctly
