# Challenge 10 — Answer Key

## Input
```javascript
const p = new Pipeline(); // precision: 2
p.run([10, 25, 40, 55], 0, 60, [1, 2, 3, 4]);
```

## Q1: normalized array
**Answer:** `[0.17, 0.42, 0.67, 0.92]`

Calculation:
- 10/60 = 0.16666... → round2 = 0.17
- 25/60 = 0.41666... → round2 = 0.42
- 40/60 = 0.66666... → round2 = 0.67
- 55/60 = 0.91666... → round2 = 0.92

Key: normalize() calls this.round() on each value.

## Q2: totalWeight
**Answer:** 10

`[1, 2, 3, 4].reduce((s, w) => s + w, 0)` = 10

## Q3: weighted array (full precision, NOT rounded)
**Answer:** `[0.017, 0.084, 0.201, 0.368]`

Calculation (using ROUNDED normalized values × weight/totalWeight):
- 0.17 × (1/10) = 0.017
- 0.42 × (2/10) = 0.084
- 0.67 × (3/10) = 0.201
- 0.92 × (4/10) = 0.368

Key: weightedTransform does NOT round. But it uses the already-rounded normalized values as input. The weighted values themselves have floating point artifacts (0.368000000000000005) but conceptually are these values.

## Q4: aggregated[1].runningMean
**Answer:** 0.05

Step by step:
- After i=0: sum = 0.017
- After i=1: sum = 0.017 + 0.084 = 0.101
- mean = 0.101 / 2 = 0.0505
- round2(0.0505) = round(5.05) / 100 = 5/100 = 0.05

## Q5: aggregated[3].runningVariance
**Answer:** 0.02

Step by step:
- sum = 0.017 + 0.084 + 0.201 + 0.368 = 0.670
- sumSq = 0.017² + 0.084² + 0.201² + 0.368² = 0.000289 + 0.007056 + 0.040401 + 0.135424 = 0.183170
- n = 4
- variance = (sumSq - sum²/n) / (n-1) = (0.183170 - 0.670²/4) / 3 = (0.183170 - 0.112225) / 3 = 0.070945 / 3 = 0.023648...
- round2(0.023648...) = round(2.3648) / 100 = 2/100 = 0.02

## Q6: finalMean
**Answer:** 0.17

cachedCompute('mean', () => { sum/length }):
- Cache miss (first call)
- sum = 0.017 + 0.084 + 0.201 + 0.368 = 0.670
- raw = 0.670 / 4 = 0.1675
- round2(0.1675) = round(16.75) / 100 = 17/100 = 0.17
- Stored in cache AND returned as 0.17

## Q7: Does lastRunningMean equal finalMean?
**Answer:** YES, they are equal (both 0.17)

Both compute the same thing (mean of 4 weighted values), both round to precision 2.
- runningMean: round2(0.670/4) = round2(0.1675) = 0.17
- finalMean: round2(0.670/4) = round2(0.1675) = 0.17

This is a trap question — they happen to be equal. Testing if the subject assumes a difference must exist (given C09's pattern of display vs calculation values).

## Q8: stats values
**Answer:** hits: 0, misses: 2, transforms: 4

- transforms: incremented once per value in weightedTransform → 4 values = 4
- misses: cachedCompute called twice (mean, stddev), both first-time → 2 misses
- hits: neither key was previously cached → 0 hits

## Scoring Notes

### Tricky Parts
- Q1: Must recognize normalize() rounds each value
- Q3: Must use the ROUNDED normalized values but NOT round the weighted output
- Q4: 0.0505 rounds to 0.05 (not 0.06) — Math.round(5.05) = 5
- Q5: Multi-step variance calculation with sample variance (n-1 denominator)
- Q6: The rounding happens in cachedCompute, not in the computation lambda
- Q7: Trap — they're equal. Tests false-positive tendency
- Q8: Tests attention to state mutation across stages

### Common Errors
- Using unrounded values for Stage 2 input (should use rounded from Stage 1)
- Rounding Stage 2 output (shouldn't — weightedTransform doesn't round)
- Population variance vs sample variance (code uses n-1)
- Assuming Q7 must show a difference (overthinking based on C09 lesson)
- Missing that cachedCompute rounds both when storing AND returning
