// Data processing pipeline with transforms, caching, and aggregation
// Each stage mutates or derives values — trace carefully!

class Pipeline {
  constructor(config = {}) {
    this.precision = config.precision || 2;
    this.cache = new Map();
    this.stats = { hits: 0, misses: 0, transforms: 0 };
  }

  round(n) {
    const factor = Math.pow(10, this.precision);
    return Math.round(n * factor) / factor;
  }

  // Stage 1: Normalize input values to 0-1 range
  normalize(values, min, max) {
    return values.map(v => {
      const raw = (v - min) / (max - min);
      return this.round(raw);
    });
  }

  // Stage 2: Apply weighted transform
  weightedTransform(values, weights) {
    if (values.length !== weights.length) throw new Error('Length mismatch');
    
    const totalWeight = weights.reduce((s, w) => s + w, 0);
    
    return values.map((v, i) => {
      const weighted = v * (weights[i] / totalWeight);
      this.stats.transforms++;
      return weighted;  // NOTE: no rounding here
    });
  }

  // Stage 3: Aggregate with running statistics
  aggregate(values) {
    let sum = 0;
    let sumSq = 0;
    const running = [];

    for (let i = 0; i < values.length; i++) {
      sum += values[i];
      sumSq += values[i] * values[i];
      const n = i + 1;
      const mean = sum / n;
      const variance = n > 1 ? (sumSq - (sum * sum) / n) / (n - 1) : 0;
      
      running.push({
        index: i,
        value: values[i],
        runningMean: this.round(mean),
        runningVariance: this.round(variance),
        runningStdDev: this.round(Math.sqrt(variance))
      });
    }

    return running;
  }

  // Stage 4: Cache-aware lookup
  cachedCompute(key, computeFn) {
    if (this.cache.has(key)) {
      this.stats.hits++;
      return this.cache.get(key);
    }
    this.stats.misses++;
    const result = computeFn();
    this.cache.set(key, this.round(result));
    return this.round(result);
  }

  // Full pipeline: normalize → weight → aggregate → cache summary
  run(values, min, max, weights) {
    // Stage 1
    const normalized = this.normalize(values, min, max);
    
    // Stage 2
    const weighted = this.weightedTransform(normalized, weights);
    
    // Stage 3
    const aggregated = this.aggregate(weighted);
    
    // Stage 4: cache the final mean and stddev
    const lastEntry = aggregated[aggregated.length - 1];
    
    const finalMean = this.cachedCompute('mean', () => {
      // Recomputes from weighted values directly
      const sum = weighted.reduce((s, v) => s + v, 0);
      return sum / weighted.length;
    });

    const finalStdDev = this.cachedCompute('stddev', () => {
      const mean = weighted.reduce((s, v) => s + v, 0) / weighted.length;
      const variance = weighted.reduce((s, v) => s + (v - mean) ** 2, 0) / (weighted.length - 1);
      return Math.sqrt(variance);
    });

    return {
      normalized,
      weighted,
      aggregated,
      summary: {
        mean: finalMean,
        stdDev: finalStdDev,
        lastRunningMean: lastEntry.runningMean,
        lastRunningStdDev: lastEntry.runningStdDev,
        cacheStats: { ...this.stats }
      }
    };
  }
}

module.exports = { Pipeline };
